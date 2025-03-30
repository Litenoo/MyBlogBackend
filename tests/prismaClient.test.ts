import Client from "../src/subServices/prismaClient";
import { PrismaClient } from "@prisma/client";

jest.mock("../src/logger.ts");

const prismaClient = new PrismaClient();
prismaClient.post.create = jest.fn();

describe("createPost", () => {
    let client: Client;

    beforeEach(() => {
        client = new Client();
        jest.spyOn(client, "addPost");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const postTemplate = {
        id: 1,
        title: "Test title",
        content: "Test content",
        published: true,
        authorId: 1,
        createdAt: new Date(),
    }

    const { title, content, published, authorId } = postTemplate; // Declaration of values used to make code cleaner

    test("Post is inserted to database", async () => {
        const prismaSpy = jest.spyOn(client.prismaClient.post, "create").mockResolvedValue(postTemplate);

        await client.addPost(title, content, published, authorId);

        expect(prismaSpy).toHaveBeenCalledWith({
            data: { title, content, published, authorId, } // Usage of declarations above
        });

        expect(prismaSpy).toHaveBeenCalledTimes(1);
    });

    test("Post is not inserted to the database if won't pass the validation", async () => {
        const prismaSpy = jest.spyOn(client.prismaClient.post, "create");

        client.addPost("", "Content", true, 1);

        expect(prismaSpy).not.toHaveBeenCalled();
    })
});

describe("addAuthor", () => {
    let client: Client;

    beforeEach(() => {
        client = new Client();
        jest.spyOn(client, "addPost");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const authorTemplate = {
        id: 1,
        nickname: "TestNickname",
        email: "test@email.com",
    }

    const { nickname, email } = authorTemplate;

    test("Author is inserted to the database", async () => {
        const prismaSpy = jest.spyOn(client.prismaClient.author, "create").mockResolvedValue(authorTemplate);

        client.addAuthor(nickname, email);

        expect(prismaSpy).toHaveBeenCalledWith({ data: { nickname, email } });
        expect(prismaSpy).toHaveBeenCalledTimes(1);
    });

    test("Author is not inserted to the database if it won't pass validation", () => {
        const prismaSpy = jest.spyOn(client.prismaClient.author, "create");

        client.addAuthor("", "test@email.com");

        expect(prismaSpy).not.toHaveBeenCalled();
    });
});

describe("getPostById", () => {
    let client: Client;

    beforeEach(() => {
        client = new Client();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const postTemplate = {
        id: 1,
        title: "MockedPost",
        content: "Mock content",
        published: true,
        authorId: 1,
        createdAt: new Date(),
    }

    test("Returns correct post by id", async () => {
        jest.spyOn(client.prismaClient.post, "findUnique").mockResolvedValue(postTemplate);

        const post = await client.getPostById(1);

        expect(post).toEqual(postTemplate);
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledTimes(1);
    });

    test("Does not return post when there is not post with given id at all", async () => {
        jest.spyOn(client.prismaClient.post, "findUnique").mockResolvedValue(null);

        const post = await client.getPostById(1);

        expect(post).toBeNull();
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledTimes(1);
    });
});

describe("getPostCardsByTag", () => {
    let client: Client;

    beforeAll(() => {
        process.env.DATABASE_URL = "DATABASE_URL=postgresql://auto:password@localhost@:5432/blog_app";
    });

    beforeEach(() => {
        client = new Client();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const prismaRecord1 = [
        {
            id: 1,
            title: "MockedPost",
            content: "Mock content",
            published: true,
            authorId: 1,
            createdAt: new Date(),
            tags: [{ tag: "SomeTag" }],
        },
        {
            id: 16,
            title: "SomePost",
            content: "Some content",
            published: false,
            authorId: 1,
            createdAt: new Date(),
            tags: [{ tag: "SomeTag" }],
        }
    ];

    const prismaRecord2 = [
        {
            id: 8,
            title: "PostAboutCpp",
            content: "Cpp content",
            published: true,
            authorId: 1,
            createdAt: new Date(),
            tags: [{ tag: "Cpp" }],
        },
        {
            id: 1,
            title: "MockedPost",
            content: "Mock content",
            published: true,
            authorId: 1,
            createdAt: new Date(),
            tags: [{ tag: "SomeTag" }],
        },
        {
            id: 16,
            title: "SomePost",
            content: "Some content",
            published: false,
            authorId: 1,
            createdAt: new Date(),
            tags: [{ tag: "SomeTag" }],
        }
    ];

    test("Returns correct posts selected by a couple of tags", async () => {
        const tagList = ["SomeTag", "Cpp"];
        const prismaSpy = jest.spyOn(client.prismaClient.post, "findMany").mockResolvedValue(prismaRecord2);

        const result = await client.getCardsByTag(tagList);

        expect(prismaSpy).toHaveBeenCalledTimes(1);
        expect(prismaSpy).toHaveBeenCalledWith({
            where: { tags: { some: { tag: { in: tagList } } } }
        });

        expect(result).toEqual(prismaRecord2);
    });

    test("Returns correct posts selected by one tag", async () => {
        const tagList = ["SomeTag"]
        const prismaSpy = jest.spyOn(client.prismaClient.post, "findMany").mockResolvedValue(prismaRecord1);

        const result = await client.getCardsByTag(tagList);

        expect(prismaSpy).toHaveBeenCalledTimes(1);
        expect(prismaSpy).toHaveBeenCalledWith({
            where: { tags: { some: { tag: { in: tagList } } } }
        });

        expect(result).toMatchObject(prismaRecord1);
    });

    test("Returns empty array when there are no posts with given tag", async () => {
        const tagList = ["UnknownTag"];

        const prismaSpy = jest.spyOn(client.prismaClient.post, "findMany");

        const result = await client.getCardsByTag(tagList);

        expect(prismaSpy).toHaveBeenCalledTimes(1);
        expect(prismaSpy).toHaveBeenCalledWith({
            where: { tags: { some: { tag: { in: tagList } } } }
        });

        expect(result).toMatchObject({});
    });
});