
import { db } from "./db";
import {
  users, questions, mastery, classes, topics, learningEvents, assignments,
  type User, type InsertUser, type Question, type Topic, type Mastery
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Learning Content
  getTopics(stage?: string): Promise<Topic[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByTopic(topicId: number, limit?: number): Promise<Question[]>;
  
  // Progress & Mastery
  getMastery(userId: number, topicId: number): Promise<Mastery | undefined>;
  updateMastery(userId: number, topicId: number, score: number): Promise<void>;
  logLearningEvent(userId: number, questionId: number, isCorrect: boolean, timeTaken: number): Promise<void>;
  
  // Teacher
  getClassesByTeacher(teacherId: number): Promise<any[]>;
  createClass(name: string, teacherId: number, code: string): Promise<any>;
  getClassAnalytics(classId: number): Promise<any[]>;

  // Parent
  getChildren(parentId: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getTopics(stage?: string): Promise<Topic[]> {
    if (stage) {
      return await db.select().from(topics).where(eq(topics.stage, stage));
    }
    return await db.select().from(topics);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [q] = await db.select().from(questions).where(eq(questions.id, id));
    return q;
  }

  async getQuestionsByTopic(topicId: number, limit: number = 10): Promise<Question[]> {
    return await db.select().from(questions)
      .where(eq(questions.topicId, topicId))
      .limit(limit);
  }

  async getMastery(userId: number, topicId: number): Promise<Mastery | undefined> {
    const [m] = await db.select().from(mastery)
      .where(and(eq(mastery.userId, userId), eq(mastery.topicId, topicId)));
    return m;
  }

  async updateMastery(userId: number, topicId: number, score: number): Promise<void> {
    const existing = await this.getMastery(userId, topicId);
    if (existing) {
      await db.update(mastery)
        .set({ 
          score: sql`${mastery.score} * 0.9 + ${score} * 0.1`, // Simple weighted moving average
          questionsAnswered: sql`${mastery.questionsAnswered} + 1`,
          lastPracticed: new Date()
        })
        .where(eq(mastery.id, existing.id));
    } else {
      await db.insert(mastery).values({
        userId,
        topicId,
        score,
        questionsAnswered: 1,
        lastPracticed: new Date()
      });
    }
  }

  async logLearningEvent(userId: number, questionId: number, isCorrect: boolean, timeTaken: number): Promise<void> {
    await db.insert(learningEvents).values({
      userId,
      questionId,
      isCorrect,
      timeTaken,
    });
    
    // Add coins for correct answers
    if (isCorrect) {
      await db.update(users)
        .set({ coins: sql`${users.coins} + 10` })
        .where(eq(users.id, userId));
    }
  }

  async getClassesByTeacher(teacherId: number): Promise<any[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async createClass(name: string, teacherId: number, code: string): Promise<any> {
    const [newClass] = await db.insert(classes).values({ name, teacherId, code }).returning();
    return newClass;
  }

  async getClassAnalytics(classId: number): Promise<any[]> {
    // Simplified analytics query
    const classStudents = await db.select().from(users).where(eq(users.classId, classId));
    
    // Mocking aggregations for now as we'd need complex joins
    return classStudents.map(s => ({
      studentId: s.id,
      name: s.firstName,
      averageMastery: 0.75, // Placeholder
      topicsCompleted: 3
    }));
  }

  async getChildren(parentId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.parentId, parentId));
  }
}

export const storage = new DatabaseStorage();
