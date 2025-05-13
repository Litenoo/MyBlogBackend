import { describe, expect, test, vi, beforeEach, beforeAll, expectTypeOf } from 'vitest';
import { PrismaClient, Post, PostTag, Prisma } from "@prisma/client";

import App from "../../src/app";
import supertest from 'supertest';

describe(`GET /api/posts`, () => {
    let prisma: PrismaClient;
    let app: App;

    beforeAll(() => {
        prisma = new PrismaClient();
        app = new App(Number(process.env.TEST_PORT));
    });

    beforeEach(() => {
        //Clear the database
        prisma.post.deleteMany();
        prisma.postTag.deleteMany();
    });

    test("HttpServer responds for ping", async () => {
        const res = await supertest(app.httpService?.api)
            .get(`/api/ping`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Pong!");
    });

    test("Post is avalaiable to insert and then publish", async () => {
        //Create post
        const insert = await supertest(app.httpService?.api)
            .post("/api/insertPost")
            .send({
                title: "Test post",
                content: "Lorem ipsum dolor amet",
                published: false,
                tags: ["test", "typescript"],
            })
            .set('Accept', 'application/json');

        expect(insert.status).toBe(201);

        //Try to fetch post, expected to fail
        const result1 = await supertest(app.httpService?.api)
            .get("/api/getPostById/1");

        expect(result1.status).toBe(404);
        expect(result1.body?.payload).toBeUndefined();

        //Publish post
        const publish = await supertest(app.httpService?.api)
            .post("/api/publishPost/1");

        expect(publish.status).toBe(200);

        //Fetch post after publishing it
        const result2 = await supertest(app.httpService?.api)
            .get("/api/getPostById/1");

        expect(result2.status).toBe(200);
        expect(result2.body?.payload.post.title).toBe("Test post");
    });

    test("Post is avalaiable to insert and then edit", async () => {
        const insert = await supertest(app.httpService?.api)
            .post("/api/insertPost")
            .send({
                title: "Test post",
                content: "Lorem ipsum dolor amet",
                published: true, //Dev
                tags: ["test", "typescript"],
            })
            .set('Accept', 'application/json');

        expect(insert.status).toBe(201);

        const edit = await supertest(app.httpService?.api)
            .post("/api/editPost/1")
            .send({
                title: "Edited post",
                published: true,
                tags: ["editing", "posts"],
            });

        expect(edit.status).toBe(200);

        const result = await supertest(app.httpService?.api)
            .get("/api/getPostById/1");


        expect(result.status).toBe(200);
        expect(result.body?.payload.post.title).toBe("Edited post");
        expect(result.body?.payload.post.published).toBe(true);
        expect(result.body?.payload.post.content).toBe("Lorem ipsum dolor amet");
        expect(result.body?.payload.post.tags[0].tag).toBe("editing");
        expect(result.body?.payload.post.tags[1].tag).toBe("posts");
    });
});