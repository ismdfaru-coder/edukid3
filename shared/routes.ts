
import { z } from 'zod';
import { insertUserSchema, insertClassSchema, insertAssignmentSchema, users, questions, mastery } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Login schemas
export const loginSchema = z.object({
  username: z.string(),
  password: z.string().optional(),
  picturePassword: z.array(z.string()).optional(),
  role: z.enum(["student", "teacher", "parent"]),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  learning: {
    getTopics: {
      method: 'GET' as const,
      path: '/api/topics',
      input: z.object({ stage: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          stage: z.string(),
          description: z.string().nullable(),
          mastery: z.number().optional(), // Personalised mastery if student
        })),
      },
    },
    getNextQuestion: {
      method: 'GET' as const,
      path: '/api/learning/question',
      input: z.object({ topicId: z.coerce.number() }),
      responses: {
        200: z.custom<typeof questions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/learning/answer',
      input: z.object({
        questionId: z.number(),
        answer: z.string(),
        timeTaken: z.number(),
      }),
      responses: {
        200: z.object({
          correct: z.boolean(),
          correctAnswer: z.string(),
          coinsEarned: z.number(),
          newMastery: z.number(),
          feedback: z.string().optional(),
        }),
      },
    },
  },
  teacher: {
    getClasses: {
      method: 'GET' as const,
      path: '/api/teacher/classes',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          studentCount: z.number(),
        })),
      },
    },
    createClass: {
      method: 'POST' as const,
      path: '/api/teacher/classes',
      input: insertClassSchema,
      responses: {
        201: z.object({ id: z.number(), code: z.string() }),
      },
    },
    getAnalytics: {
      method: 'GET' as const,
      path: '/api/teacher/analytics',
      input: z.object({ classId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.object({
          studentId: z.number(),
          name: z.string(),
          averageMastery: z.number(),
          topicsCompleted: z.number(),
        })),
      },
    },
  },
  parent: {
    getChildren: {
      method: 'GET' as const,
      path: '/api/parent/children',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          firstName: z.string(),
          yearGroup: z.number(),
          coins: z.number(),
          masterySummary: z.array(z.object({
            topic: z.string(),
            score: z.number(),
          })),
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
