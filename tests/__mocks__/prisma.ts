import { PrismaClient } from '@prisma/client';

export const prisma = {
  post: {
    findMany: jest.fn().mockResolvedValue([
      { id: 1, title: 'Test Post 1' },
      { id: 2, title: 'Test Post 2' }
    ]),
    create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 3, ...data }))
  }
} as unknown as PrismaClient;