import express from "express";
import PrsmClient from "./prismaClient";
import { Post, Author } from "@prisma/client";
import logger from "../logger";

type PostInput = Omit<Post, 'id' | 'createdAt'>
type AuthorInput = Omit<Author, 'id'>

const PORT = 3001; // DEV

export default class HttpClient {
    protected api;
    protected prismaClient: PrsmClient;

    constructor(prismaClient: PrsmClient) {

        this.prismaClient = prismaClient;

        this.api = express();
        this.api.use(express.json());

        this.api.get("/api/ping", (req, res) => {
            res.json({ message: "Pong!" });
        });

        this.api.post("/api/addPost", async (req, res) => {
            try {
                const payload: PostInput = req.body;
                console.log(`Payload : ${payload}`);
                const result = await prismaClient.addPost(payload.title, payload.content, payload.published, payload.authorId); //authenticate author later if needed

                if (!result.success) {
                    res.status(400).json({
                        message: result.message,
                    });
                } else {
                    res.status(201).json({
                        message: "Post created successfully",
                        postId: result.postId,
                    });
                }
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        this.api.post("/api/addAuthor", async (req, res) => {
            try {
                const payload: AuthorInput = req.body;
                console.log(`Payload : ${payload}`);
                const result = await prismaClient.addAuthor(payload.nickname, payload.email);

                if (!result.success) {
                    res.status(400).json({
                        message: result.message,
                    });
                } else {
                    res.status(201).json({
                        message: "Author registered successfully",
                    });
                }
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        this.api.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}