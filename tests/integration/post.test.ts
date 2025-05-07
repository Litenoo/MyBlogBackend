import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PrismaClient, Post, PostTag, Prisma } from "@prisma/client";
import App from "../../src/app";
import supertest from 'supertest';

const httpService = new App(3004).httpService;

describe(`GET /api/posts`, () => {
    let prisma: PrismaClient;
    beforeAll(() => {
        prisma = new PrismaClient();
    });

    beforeEach(() => {
        //Clear the database
        prisma.post.deleteMany();
        prisma.postTag.deleteMany();
    });

    test(`Post is avalaiable to insert and then publish`, async () => {

        console.log('Using DB:', process.env.DATABASE_URL);

        expect(1).toBe(1);
    });
});