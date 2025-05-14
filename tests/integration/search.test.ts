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

        await prisma.postTag.createMany({
            data: [
                { tag: "typescript" },
                { tag: "rust" },
            ],
            skipDuplicates: true
        });

        await prisma.$transaction([
            prisma.post.create({
                data: {
                    title: "Test post",
                    content: "Lorem ipsum dolor amet",
                    published: false,
                    tags: {
                        connectOrCreate: [
                            { where: { tag: "typescript" }, create: { tag: "typescript" } },
                        ],
                    },
                },
            }),
            prisma.post.create({
                data: {
                    title: "Second Post",
                    content: "Some content",
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
                    title: "Third Post",
                    content: "SomeContent",
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
                    title: "Third Post",
                    content: "AuthorLitenoo",
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
                    title: "Third Post",
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

    beforeEach(() => {
        //Clear the database
        prisma.post.deleteMany();
        prisma.postTag.deleteMany();
    });

    //The feature which is tested below is made to show tags above the posts in the search results.
    //When the user would for example type in "Typescript" it will suggest adding that tag to the
    // criteria of search.
    test("Searching by keyword works correctly", async () => {

    });
});

