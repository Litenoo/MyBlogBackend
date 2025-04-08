import express from "express";
import PrsmClient from "./prismaClient";
import { Post } from "@prisma/client";

type PostInput = Omit<Post, 'id' | 'createdAt'>

const PORT = 3001; // DEV

export default class HttpClient {
    protected api;
    protected prismaClient: PrsmClient;

    constructor(prismaClient: PrsmClient) {

        this.prismaClient = prismaClient;

        this.api = express();

        this.api.get("/api/ping", (req, res) => {
            res.json({ message: "Pong!" });
        });

        this.api.get("/api/addPost", async (req, res) => {
            const payload: PostInput = req.body;
            const result = await prismaClient.addPost(payload.title, payload.content, payload.published, payload.authorId); //authenticate author later if needed

            if (!result.success) {
                console.log("fialed to create user"); //dev
                res.status(404).json({
                    message: result.message,
                });
            } else {
                console.log("Successfully created user");
                res.status(201);
            }
        });

        this.api.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}