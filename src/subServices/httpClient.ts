import express from "express";
import PrsmClient from "./prismaClient";
import { Post, Author } from "@prisma/client";
import logger from "../logger";

interface Response<T = any> {
    success: boolean,
    message: string,
    payload?: T,
}

function createReponse<T>(success: boolean, message: string = "Successful", payload?: T): Response<T> {
    return {
        success,
        message,
        payload
    };
}

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
            res.json(createReponse(true, "Pong!", "Response from the api."));
        });

        this.api.post("/api/addPost", async (req, res) => {
            try {
                const payload: PostInput = req.body;
                const result = await this.prismaClient.addPost({
                    title: payload.title,
                    content: payload.content,
                    published: payload.published,
                    authorId: payload.authorId
                }); //authenticate author later if needed

                if (!result.success) {
                    res.status(400).json(createReponse(false, result.message));
                } else {
                    res.status(201).json(createReponse(true, "Post created successfuly", result.payload?.postId));
                }
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        this.api.post("/api/addAuthor", async (req, res) => {
            try {
                const payload: AuthorInput = req.body;

                const result = await this.prismaClient.addAuthor({
                    nickname: payload.nickname,
                    email: payload.email
                });

                if (!result.success) {
                    res.status(400).json(createReponse(false, result.message));
                } else {
                    res.status(201).json(createReponse(true, "Author registered successfully"));
                }
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        this.api.get("/api/getPostById/:postId", async (req, res) => {
            try {
                const { postId } = req.params;

                if (!postId) {
                    res.status(400).send(createReponse(false, "PostId is required"))
                }

                const response = await this.prismaClient.getPostById({ postId: Number(postId) });

                if (response.success) {
                    res.status(200).json(createReponse(true, undefined, response.payload));
                } else {
                    res.status(404).json(createReponse(false, "Post not found"));
                }
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        // Replace that with selecting a couple of posts

        // this.api.post("/api/getPostCards", async (req, res) => {
        //     try {
        //         const postsCards = this.prismaClient.getAllPostsCards();
        //     } catch (err) {
        //         logger.error(new Error((err as Error).message).stack);
        //         res.status(500).json(createReponse(false, "Internal server error"));
        //     }
        // });

        this.api.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}