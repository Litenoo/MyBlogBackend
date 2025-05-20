import { describe, expect, test, vi, beforeEach, beforeAll, expectTypeOf } from 'vitest';
import { PrismaClient, Post, PostTag, Prisma } from "@prisma/client";

import App from "../../src/app";
import supertest from 'supertest';

describe("Search feature testing", () => {
    let prisma: PrismaClient;
    let app: App;

    beforeEach(async () => {
        prisma = new PrismaClient();
        app = new App(Number(process.env.TEST_PORT));

        //Clear database
        await prisma.post.deleteMany();
        await prisma.postTag.deleteMany();

        await prisma.postTag.createMany({
            data: [
                { tag: "typescript" },
                { tag: "rust" },
                { tag: "assembly" },
            ],
            skipDuplicates: true,
        });

        await prisma.$transaction([
            prisma.post.create({
                data: {
                    title: "Unpublished post assembly",
                    content: "Lorem ipsum dolor amet",
                    published: false,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "assembly" }, create: { tag: "assembly" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Published post assembly",
                    content: "Some content",
                    published: true,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "assembly" }, create: { tag: "assembly" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Assembly is great",
                    content: "Some Content About Assembly",
                    published: true,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "assembly" }, create: { tag: "assembly" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Typescript Interfaces",
                    content: "Interfaces in typescript",
                    published: true,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "typescript" }, create: { tag: "typescript" } },
                            { where: { tag: "testing" }, create: { tag: "testing" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Typescript Types",
                    content: "Types in typescript",
                    published: true,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "typescript" }, create: { tag: "typescript" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Rust is great",
                    content: "SomeContentAboutRust",
                    published: true,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "Rust" }, create: { tag: "Rust" } },
                        ],
                    },
                },
            }),
        ]);
    });
    //The feature which is tested below is made to show tags above the posts in the search results.
    //When the user would for example type in "Typescript" it will suggest adding that tag to the
    // criteria of search.

    test("Multisearch by keyword. Only published and Insensitive", async () => {
        const search = await supertest(app.httpService?.api)
            .post("/api/search/multisearch")
            .send({
                criteria: {
                    keyword: "assembly",
                    quantity: 10,
                }
            });


        expect(search.status).toBe(200);
        expect(search.body.success).toBe(true);
        expect(search.body.payload.postCards).toHaveLength(2);
        expect(search.body.payload.postTags[0].tag).toBe("assembly");
    });

    test("Multisearch by keyword with tags", async () => {
        const search = await supertest(app.httpService?.api)
            .post("/api/search/multisearch")
            .send({
                criteria: {
                    tags: ["typescript"],
                    quantity: 10,
                }
            });

        console.dir(search.body.payload, { detph: null });

        expect(search.status).toBe(200);
        expect(search.body.success).toBe(true);
        expect(search.body.payload.postCards).toHaveLength(2);
        expect(search.body.payload.postTags).toHaveLength(0);
    });
});