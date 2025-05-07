import express from "express";
import PrsmClient from "./databaseService";
import { Post, PostTag } from "@prisma/client";
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

type PostInsertTemplate = {
    title: string,
    content: string,
    published?: boolean,
    tags?: string[],
}

type SearchPostsAndTagsTemplate = {
    tags: string[],
    keyword: string,
    quantity: number,
}

export default class HttpClient {
    protected api;
    protected databaseService: PrsmClient;

    constructor(databaseService: PrsmClient) {

        this.databaseService = databaseService;

        this.api = express();
        this.api.use(express.json());

        this.api.get("/api/ping", (req, res) => {
            res.json(createReponse(true, "Pong!", "Response from the api."));
        });

        this.api.post("/api/insertPost", async (req, res) => {
            try {
                const payload: PostInsertTemplate = req.body;
                const response = await this.databaseService.insertPost(payload);

                if (!response.success) {
                    res.status(400).json(createReponse(false, response.message));
                    return;
                }
                res.status(201).json(createReponse(true, "Post created successfuly", response.payload));
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        this.api.post("/api/search/tags-posts", async (req, res) => {
            try {
                const { quantity, tags, keyword }: SearchPostsAndTagsTemplate = req.body;
                const response = await this.databaseService.getPostSnippets({ quantity, tags, keyword });
                if (!response.success) {
                    res.status(400).json(createReponse(false, response.message, response.payload));
                    return;
                }
                res.status(200).json(createReponse(true, response.message, response.payload));
            } catch (err) {
                logger.error((err as Error).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        this.api.post<{ tagName: string }>("/api/insertTag/:tagName", async (req, res) => {
            try {
                const { tagName } = req.params;
                if (!tagName) { // DEV return could be there, but i cant put it.
                    res.status(400).json(createReponse(false, "Tag name is required"));
                }

                const response = await this.databaseService.insertTag({ tag: tagName });

                if (!response.success) {
                    res.status(400).json(createReponse(false, response.message, response.payload));
                    return;
                }
                res.status(200).json(createReponse(true, response.message, response.payload));
            } catch (err) {
                logger.error((err as Error).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });

        this.api.get("/api/getPostById/:postId", async (req, res) => {
            try {
                const { postId } = req.params;

                if (!postId) {
                    res.status(400).json(createReponse(false, "Post id is required"));
                }

                const response = await this.databaseService.getPostById({ postId: Number(postId) });

                if (response.success) {
                    res.status(200).json(createReponse(true, response.message, response.payload));
                    return;
                }
                res.status(404).json(createReponse(false, "Post not found"));
            } catch (err) {
                logger.error(new Error((err as Error).message).stack);
                res.status(500).json(createReponse(false, "Internal server error"));
            }
        });
    }

    listen(port: number): void {
        this.api.listen(port, () => {
            console.log(`HttpService is running on port ${port}`)
        });
    }
}