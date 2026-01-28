
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, loginSchema } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { db } from "./db";
import { questions, topics, users } from "@shared/schema";

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: "student" | "teacher" | "parent";
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "edukid_secret",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset cookie expiration on every request
      store: new SessionStore({ 
        checkPeriod: 86400000,
        ttl: 60 * 60 * 24 // 24 hours in seconds
      }),
      cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours in milliseconds
      }, 
    })
  );

  // === AUTH ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      
      // Universal admin login - works for any role
      if (input.username === "admin" && input.password === "admin") {
        let user = await storage.getUserByUsername("admin");
        if (!user) {
          // Create admin user if doesn't exist
          user = await storage.createUser({
            username: "admin",
            password: "admin",
            role: input.role,
            firstName: "Admin",
            picturePassword: null,
            avatarConfig: {},
            classId: null,
            parentId: null,
            yearGroup: input.role === "student" ? 5 : null,
          });
        }
        req.session.userId = user.id;
        req.session.role = input.role;
        res.json({ ...user, role: input.role });
        return;
      }
      
      const user = await storage.getUserByUsername(input.username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== input.role) {
        return res.status(401).json({ message: "Invalid role for this user" });
      }

      // Simple password check (In production, use hashing!)
      // For students with picture password, we check the array match
      if (user.role === "student" && input.picturePassword) {
        const stored = user.picturePassword; // e.g. ["cat", "dog", "apple"]
        const provided = input.picturePassword;
        const isMatch = stored && 
          stored.length === provided.length && 
          stored.every((val, index) => val === provided[index]);
          
        if (!isMatch) return res.status(401).json({ message: "Wrong picture password" });
      } else {
        // Standard password
        if (user.password !== input.password) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }

      req.session.userId = user.id;
      req.session.role = user.role as any;
      res.json(user);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).send();
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).send();
    res.json(user);
  });

  // === LEARNING ===
  app.get(api.learning.getTopics.path, async (req, res) => {
    const stage = req.query.stage as string | undefined;
    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
    const allTopics = await storage.getTopics(stage);
    
    // Filter by subject if provided
    const filteredTopics = subjectId 
      ? allTopics.filter(t => t.subjectId === subjectId)
      : allTopics;
    
    // If student, attach mastery
    if (req.session.role === "student" && req.session.userId) {
      const topicsWithMastery = await Promise.all(filteredTopics.map(async (t) => {
        const m = await storage.getMastery(req.session.userId!, t.id);
        return { ...t, mastery: m?.score || 0 };
      }));
      return res.json(topicsWithMastery);
    }
    
    res.json(filteredTopics);
  });

  app.get(api.learning.getNextQuestion.path, async (req, res) => {
    const topicId = Number(req.query.topicId);
    if (!req.session.userId) return res.status(401).send();
    
    // Pick based on difficulty vs mastery
    const topicMastery = await storage.getMastery(req.session.userId, topicId);
    const currentScore = topicMastery?.score || 0;
    
    // Map score (0.0-1.0) to difficulty (1-5)
    // 0.0 -> 1
    // 0.5 -> 3
    // 1.0 -> 5
    const targetDifficulty = Math.max(1, Math.min(5, Math.floor(currentScore * 5) + 1));
    
    const allQuestions = await storage.getQuestionsByTopic(topicId);
    if (allQuestions.length === 0) return res.status(404).json({ message: "No questions found" });
    
    // Filter by difficulty and pick random
    let candidateQuestions = allQuestions.filter(q => q.difficulty === targetDifficulty);
    if (candidateQuestions.length === 0) {
      candidateQuestions = allQuestions; // Fallback
    }
    
    const randomQ = candidateQuestions[Math.floor(Math.random() * candidateQuestions.length)];
    res.json(randomQ);
  });

  app.post(api.learning.submitAnswer.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).send();
    
    const { questionId, answer, timeTaken } = req.body;
    const question = await storage.getQuestion(questionId);
    
    if (!question) return res.status(404).json({ message: "Question not found" });
    
    const isCorrect = question.correctAnswer === answer;
    
    // Log event and update mastery
    await storage.logLearningEvent(req.session.userId, questionId, isCorrect, timeTaken);
    await storage.updateMastery(req.session.userId, question.topicId, isCorrect ? 1.0 : 0.0);
    
    // Get new mastery
    const masteryRecord = await storage.getMastery(req.session.userId, question.topicId);
    
    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      coinsEarned: isCorrect ? 10 : 0,
      newMastery: masteryRecord?.score || 0,
      feedback: isCorrect ? "Great job!" : question.explanation || "Keep trying!",
    });
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("student1");
  if (existingUsers) return;

  // Create Science Topics (subjectId: 1)
  const scienceTopics = [
    { name: "Electricity", slug: "electricity", stage: "KS2", subjectId: 1, description: "Circuits and conductors" },
    { name: "Plants", slug: "plants", stage: "KS2", subjectId: 1, description: "Photosynthesis and growth" },
    { name: "Space", slug: "space", stage: "KS2", subjectId: 1, description: "Planets and the solar system" },
  ];

  // Create Maths Topics (subjectId: 2)
  const mathsTopics = [
    { name: "Addition", slug: "addition", stage: "KS2", subjectId: 2, description: "Adding numbers together" },
    { name: "Subtraction", slug: "subtraction", stage: "KS2", subjectId: 2, description: "Taking numbers away" },
    { name: "Multiplication", slug: "multiplication", stage: "KS2", subjectId: 2, description: "Times tables and products" },
    { name: "Division", slug: "division", stage: "KS2", subjectId: 2, description: "Sharing and grouping" },
    { name: "Fractions", slug: "fractions", stage: "KS2", subjectId: 2, description: "Parts of a whole" },
  ];
  
  const createdTopics = [];
  for (const t of [...scienceTopics, ...mathsTopics]) {
    const [topic] = await db.insert(topics).values(t).returning();
    createdTopics.push(topic);
  }

  // Create Users
  await storage.createUser({
    username: "admin",
    password: "admin",
    role: "teacher",
    firstName: "Admin",
    picturePassword: null,
    avatarConfig: {},
    classId: null,
    parentId: null,
    yearGroup: null,
  });

  await storage.createUser({
    username: "student1",
    role: "student",
    firstName: "Alex",
    yearGroup: 5,
    picturePassword: null,
    password: "admin",
    avatarConfig: { color: "blue" },
    classId: null,
    parentId: null,
  });

  // Create Science Questions
  const electricity = createdTopics.find(t => t.slug === "electricity");
  if (electricity) {
    await db.insert(questions).values([
      {
        topicId: electricity.id,
        content: "Which of these is a good conductor of electricity?",
        correctAnswer: "Copper",
        distractors: ["Wood", "Plastic", "Rubber"],
        difficulty: 2,
        type: "multiple_choice",
        explanation: "Metals like copper allow electricity to flow freely."
      },
      {
        topicId: electricity.id,
        content: "What component breaks a circuit to stop the flow?",
        correctAnswer: "Switch",
        distractors: ["Battery", "Bulb", "Wire"],
        difficulty: 3,
        type: "multiple_choice",
        explanation: "A switch opens the circuit gap."
      }
    ]);
  }

  const space = createdTopics.find(t => t.slug === "space");
  if (space) {
    await db.insert(questions).values([
      {
        topicId: space.id,
        content: "Which planet is closest to the Sun?",
        correctAnswer: "Mercury",
        distractors: ["Venus", "Earth", "Mars"],
        difficulty: 2,
        type: "multiple_choice",
        explanation: "Mercury is the first planet."
      },
      {
        topicId: space.id,
        content: "How many planets are in our solar system?",
        correctAnswer: "8",
        distractors: ["7", "9", "10"],
        difficulty: 1,
        type: "multiple_choice",
        explanation: "There are 8 planets in our solar system."
      }
    ]);
  }

  const plants = createdTopics.find(t => t.slug === "plants");
  if (plants) {
    await db.insert(questions).values([
      {
        topicId: plants.id,
        content: "What do plants need to make food?",
        correctAnswer: "Sunlight",
        distractors: ["Darkness", "Music", "Salt"],
        difficulty: 1,
        type: "multiple_choice",
        explanation: "Plants use sunlight for photosynthesis."
      }
    ]);
  }

  // Create Maths Questions
  const addition = createdTopics.find(t => t.slug === "addition");
  if (addition) {
    await db.insert(questions).values([
      { topicId: addition.id, content: "What is 5 + 3?", correctAnswer: "8", distractors: ["7", "9", "6"], difficulty: 1, type: "multiple_choice", explanation: "5 + 3 = 8" },
      { topicId: addition.id, content: "What is 12 + 7?", correctAnswer: "19", distractors: ["18", "20", "17"], difficulty: 2, type: "multiple_choice", explanation: "12 + 7 = 19" },
      { topicId: addition.id, content: "What is 25 + 16?", correctAnswer: "41", distractors: ["40", "42", "39"], difficulty: 3, type: "multiple_choice", explanation: "25 + 16 = 41" },
      { topicId: addition.id, content: "What is 48 + 27?", correctAnswer: "75", distractors: ["74", "76", "65"], difficulty: 4, type: "multiple_choice", explanation: "48 + 27 = 75" },
      { topicId: addition.id, content: "What is 156 + 89?", correctAnswer: "245", distractors: ["235", "255", "244"], difficulty: 5, type: "multiple_choice", explanation: "156 + 89 = 245" },
    ]);
  }

  const subtraction = createdTopics.find(t => t.slug === "subtraction");
  if (subtraction) {
    await db.insert(questions).values([
      { topicId: subtraction.id, content: "What is 9 - 4?", correctAnswer: "5", distractors: ["4", "6", "3"], difficulty: 1, type: "multiple_choice", explanation: "9 - 4 = 5" },
      { topicId: subtraction.id, content: "What is 15 - 8?", correctAnswer: "7", distractors: ["6", "8", "9"], difficulty: 2, type: "multiple_choice", explanation: "15 - 8 = 7" },
      { topicId: subtraction.id, content: "What is 42 - 19?", correctAnswer: "23", distractors: ["22", "24", "21"], difficulty: 3, type: "multiple_choice", explanation: "42 - 19 = 23" },
      { topicId: subtraction.id, content: "What is 100 - 37?", correctAnswer: "63", distractors: ["64", "62", "73"], difficulty: 4, type: "multiple_choice", explanation: "100 - 37 = 63" },
    ]);
  }

  const multiplication = createdTopics.find(t => t.slug === "multiplication");
  if (multiplication) {
    await db.insert(questions).values([
      { topicId: multiplication.id, content: "What is 3 × 4?", correctAnswer: "12", distractors: ["11", "14", "10"], difficulty: 1, type: "multiple_choice", explanation: "3 × 4 = 12" },
      { topicId: multiplication.id, content: "What is 6 × 7?", correctAnswer: "42", distractors: ["36", "48", "49"], difficulty: 2, type: "multiple_choice", explanation: "6 × 7 = 42" },
      { topicId: multiplication.id, content: "What is 8 × 9?", correctAnswer: "72", distractors: ["63", "81", "64"], difficulty: 3, type: "multiple_choice", explanation: "8 × 9 = 72" },
      { topicId: multiplication.id, content: "What is 12 × 11?", correctAnswer: "132", distractors: ["121", "144", "122"], difficulty: 4, type: "multiple_choice", explanation: "12 × 11 = 132" },
    ]);
  }

  const division = createdTopics.find(t => t.slug === "division");
  if (division) {
    await db.insert(questions).values([
      { topicId: division.id, content: "What is 10 ÷ 2?", correctAnswer: "5", distractors: ["4", "6", "8"], difficulty: 1, type: "multiple_choice", explanation: "10 ÷ 2 = 5" },
      { topicId: division.id, content: "What is 24 ÷ 6?", correctAnswer: "4", distractors: ["3", "5", "6"], difficulty: 2, type: "multiple_choice", explanation: "24 ÷ 6 = 4" },
      { topicId: division.id, content: "What is 56 ÷ 8?", correctAnswer: "7", distractors: ["6", "8", "9"], difficulty: 3, type: "multiple_choice", explanation: "56 ÷ 8 = 7" },
      { topicId: division.id, content: "What is 144 ÷ 12?", correctAnswer: "12", distractors: ["11", "13", "14"], difficulty: 4, type: "multiple_choice", explanation: "144 ÷ 12 = 12" },
    ]);
  }

  const fractions = createdTopics.find(t => t.slug === "fractions");
  if (fractions) {
    await db.insert(questions).values([
      { topicId: fractions.id, content: "What is half of 10?", correctAnswer: "5", distractors: ["4", "6", "2"], difficulty: 1, type: "multiple_choice", explanation: "Half of 10 is 5" },
      { topicId: fractions.id, content: "What is 1/4 of 20?", correctAnswer: "5", distractors: ["4", "10", "15"], difficulty: 2, type: "multiple_choice", explanation: "1/4 of 20 is 5" },
      { topicId: fractions.id, content: "What is 3/4 of 100?", correctAnswer: "75", distractors: ["50", "25", "80"], difficulty: 3, type: "multiple_choice", explanation: "3/4 of 100 is 75" },
    ]);
  }
}
