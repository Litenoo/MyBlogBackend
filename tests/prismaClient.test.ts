import Client from "../src/subServices/prismaClient";

jest.mock("../src/logger.ts");

describe("Client.getPostById", () => {
    let client: Client;

    beforeEach(() => {
        client = new Client();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Should return the correct post by id", async () => {
        const mockPost = {
            id: 1,
            title: "MockedPost",
            content: "Mock content",
            published: true,
            authorId: 1,
            createdAt: new Date(),
        }

        jest.spyOn(client.prismaClient.post, "findUnique").mockResolvedValue(mockPost);

        const post = await client.getPostById(1);

        expect(post).toEqual(mockPost);
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledTimes(1);
    });

    test("Should not return the post which does not exist", async () => {
        jest.spyOn(client.prismaClient.post, "findUnique").mockResolvedValue(null);

        const post = await client.getPostById(1);

        expect(post).toBeNull();
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(client.prismaClient.post.findUnique).toHaveBeenCalledTimes(1);
    });
});