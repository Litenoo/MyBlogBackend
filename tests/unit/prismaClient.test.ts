import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PrismaClient } from "@prisma/client";
import DbClient from "../../src/subServices/dbClitent";

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: vi.fn(() => ({
            author: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            post: {
                findUnique: vi.fn(),
                create: vi.fn(),
            }
        }))
    };
});

describe("Author management", async () => {
    let prisma: PrismaClient;
    let dbClient: DbClient;

    beforeEach(() => {
        prisma = new PrismaClient();
        dbClient = new DbClient();
        vi.restoreAllMocks();
    });
});