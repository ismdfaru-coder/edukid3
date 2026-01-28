
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USER & AUTH ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password"), // Nullable for students using picture passwords
  role: text("role", { enum: ["student", "teacher", "parent"] }).notNull(),
  picturePassword: text("picture_password").array(), // Array of image IDs/names
  firstName: text("first_name").notNull(),
  yearGroup: integer("year_group"), // 1-9
  classId: integer("class_id"), // Link to class for students
  parentId: integer("parent_id"), // Link to parent for students
  coins: integer("coins").default(0),
  avatarConfig: jsonb("avatar_config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").notNull(),
  code: text("code").unique().notNull(), // For joining
});

// === CURRICULUM & CONTENT ===
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Science"
  slug: text("slug").unique().notNull(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  name: text("name").notNull(), // e.g., "Electricity", "Space", "Plants"
  slug: text("slug").unique().notNull(),
  stage: text("stage", { enum: ["KS1", "KS2", "KS3"] }).notNull(),
  description: text("description"),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["multiple_choice", "drag_drop"] }).default("multiple_choice"),
  correctAnswer: text("correct_answer").notNull(),
  distractors: jsonb("distractors").notNull(), // Array of strings
  difficulty: integer("difficulty").default(1), // 1-10
  explanation: text("explanation"),
});

// === ADAPTIVE LEARNING & PROGRESS ===
export const mastery = pgTable("mastery", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  score: real("score").default(0.0), // 0.0 to 1.0
  questionsAnswered: integer("questions_answered").default(0),
  lastPracticed: timestamp("last_practiced"),
});

export const learningEvents = pgTable("learning_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  timestamp: timestamp("timestamp").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  classId: integer("class_id"), // Null if individual
  studentId: integer("student_id"), // Null if whole class
  topicId: integer("topic_id").notNull(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ one, many }) => ({
  class: one(classes, { fields: [users.classId], references: [classes.id] }),
  parent: one(users, { fields: [users.parentId], references: [users.id], relationName: "parent_child" }),
  children: many(users, { relationName: "parent_child" }),
  mastery: many(mastery),
  events: many(learningEvents),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, { fields: [classes.teacherId], references: [users.id] }),
  students: many(users),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  topic: one(topics, { fields: [questions.topicId], references: [topics.id] }),
}));

// === ZOD SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, coins: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, completed: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Mastery = typeof mastery.$inferSelect;
