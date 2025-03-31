import express from "express";
import PrsmClient from "./prismaClient";

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

        this.api.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}