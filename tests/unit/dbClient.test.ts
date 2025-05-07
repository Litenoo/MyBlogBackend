import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PrismaClient, Post, PostTag, Prisma } from "@prisma/client";
import DbClient from "../../src/subServices/databaseService";
import { Response } from "../../src/subServices/databaseService"


//**Mocking the database is needed because in the build returned value is the result
// of database service which does not run during the unit tests.
// **/

describe("dbClient.insertPost", async () => {
    let dbClient: DbClient;
    let idN = 1;

    const prismaMock = {
        post: {
            create: vi.fn().mockResolvedValue({
                id: idN++,
                title: 'Some title',
                content: 'Lorem ipsum dolor amet',
                published: false,
                createdAt: new Date(),
            })
        },
    };

    beforeEach(() => {
        dbClient = new DbClient(prismaMock as unknown as PrismaClient);
    });

    test("should insert post when requirements met", async () => {
        const post = {
            title: "Some title",
            content: "Lorem ipsum dolor amet",
        }
        const response: Response<{ post: Post }> = await dbClient.insertPost(post);
        expect(response.success).toBe(true);
        expect(response.payload).toBeDefined();
        expect(response.payload?.post).toMatchObject(post); // check if matches passed object
        expect(response.payload?.post).toMatchObject({ // checks if id and createdAt variables are defined
            id: expect.any(Number),
            createdAt: expect.any(Date),
        });
    });

    test("should not insert the post when it won't met the Zod requirements", async () => {
        const post = {
            title: "a", //single letter, when the requirement is 2
            content: "Lorem ipsum dolor amet",
        }
        const response: Response<{ post: Post }> = await dbClient.insertPost(post);
        expect(response.success).toBe(false);
        expect(response.message).toBe("Title must be at least 2 characters");
    });
});


describe("dbClient.insertTag", async () => {
    let dbClient: DbClient;
    const prismaMock = {
        postTag: {
            create: vi.fn().mockResolvedValue({
                id: 1,
                tag: "TagTitle",
                createdAt: new Date(),

            }),
        }
    }
    beforeEach(() => {
        dbClient = new DbClient(prismaMock as unknown as PrismaClient);
    });

    test("should return insert tag if data is valid", async () => {
        const title = "TagTitle";
        const response: Response<{ tag: PostTag }> = await dbClient.insertTag({ tag: title });
        expect(response.success).toBe(true);
        expect(response.payload?.tag.tag).toBe(title);
    });

    test("should not return insert tag data if is not valid", async () => {
        const title = "SomeHorrendouslyLongStringThatIsNotValid";
        const response: Response<{ tag: PostTag }> = await dbClient.insertTag({ tag: title });
        expect(response.success).toBe(false);
        expect(response.message).toBe("Title is too long. Maximum lenght is 32");
        expect(response.payload).toBeUndefined();
    });
});

describe("dbClient.getPostById", () => { // DEV rewrite to handle tags as well
    let dbClient: DbClient;
    const prismaMock = { post: { findUnique: vi.fn() } } // being setup for every test independently

    beforeEach(() => {
        dbClient = new DbClient(prismaMock as unknown as PrismaClient);
    });

    test("should return post by id when it does exist", async () => {
        //Mock setup
        const id = 1;
        const mockPost = {
            id: id,
            title: 'Some title',
            content: 'Lorem ipsum dolor amet',
            published: false,
            createdAt: new Date(),
        }
        prismaMock.post.findUnique.mockResolvedValue(mockPost);

        //Test
        const response = await dbClient.getPostById({ postId: id });
        expect(response.success).toBe(true);
        expect(response.payload).toBeDefined();

        const post: Post | null | undefined = response.payload?.post;
        expect(post).toBeDefined();
        expect(post).toMatchObject({
            id: expect.any(Number),
            createdAt: expect.any(Date),
        });
    });

    test("should not return post by id when it does not exist", async () => {
        //Mock setup
        const id = 1;
        const mockPost = {
            id: id,
            title: 'Some title',
            content: 'Lorem ipsum dolor amet',
            published: false,
            createdAt: new Date(),
        }
        prismaMock.post.findUnique.mockResolvedValue(mockPost);

        //Test
        const response = await dbClient.getPostById({ postId: 999 }); // not exisiting id
        expect(response.success).toBe(true);
        expect(response.payload).toBeDefined();

        const post: Post | null | undefined = response.payload?.post;
        expect(post).toBeDefined();
        expect(post).toMatchObject({
            id: expect.any(Number),
            createdAt: expect.any(Date),
        });
    });
});