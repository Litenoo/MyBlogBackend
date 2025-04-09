import { PrismaClient } from "@prisma/client";
import validator, { contains } from "validator";

import logger from "../logger";

export default class Client {
    protected prisma = new PrismaClient();

    public get prismaClient() { // Only for testing
        return this.prisma;
    }

    async addAuthor(nickname: string, email: string): Promise<{ success: Boolean, message?: string }> {
        try {
            // Validation
            if (!nickname || !email) {
                logger.error(new Error(`Passed params are undefined`).stack);
                return { success: false, message: "Missing required variables" };
            }

            if (!validator.isEmail(email)) {
                return { success: false, message: "The email is not valid" };
            }

            if (!validator.isLength(nickname, { min: 2, max: 32 })) {
                return { success: false, message: "The nickname lenght could be 2 > and < 32" };
            }

            // Database query
            await this.prisma.author.create({
                data: {
                    nickname, // Nicknme of the author (visible for users)
                    email, // Email of the author
                }
            });

            return { success: true, message: "Author registered successfully" }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" }
        }
    }

    async addPost(title: string, content: string, published: boolean = false, authorId: number): Promise<{ success: boolean, message?: string, postId?: number }> {
        try {
            // Check if variables passed
            if (!title || !content || !published || !authorId) {
                const errorMsg = `Missing required variables`;
                logger.error(new Error(errorMsg).stack);
                return { success: false, message: errorMsg };
            }

            // Check if title length is enough
            if (!validator.isLength(title, { min: 2, max: 128 })) {
                const errorMsg = `Title must be between 2 and 128 characters`;
                logger.error(new Error(errorMsg).stack);
                return { success: false, message: errorMsg };
            }

            //Check if author exist
            const author = await this.prisma.author.findUnique({
                where: { id: authorId },
            });
            if (!author) { return { success: false, message: "Author not found" } };

            // Database query
            const post = await this.prisma.post.create({
                data: {
                    title, // Title of post
                    content, // Markdown content of post
                    published, // Could be visible for users
                    authorId, // Id of the author of post 
                }
            });
            return { success: true, postId: post.id };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: `Unexpected error occured` };
        }
    }

    async getPostById(postId: number) {
        const post = await this.prisma.post.findUnique({
            where: {
                id: postId,
            }
        });

        return post ? post : null;
    }

    async getCardsByTag(tags: string[]) {
        return this.prisma.post.findMany({
            where: { tags: { some: { tag: { in: tags, } } } }
        }) || null;
    }

    async searchForPost(query: string) {
        const tags = await this.prisma.postTag.findMany({
            where: {
                tag: { contains: query, mode: 'insensitive' }
            }
        });

        const posts = await this.prisma.post.findMany({
            where: {
                title: { contains: query, mode: 'insensitive' }
            }
        });
        return [...tags, ...posts];
    }

    async getAllPostsCards() {
        return await this.prisma.post.findMany();
    }

    async disconnect() {
        try {
            await this.prisma.$disconnect();
        } catch (err) {
            logger.error((err as Error).stack);
        }
    }
}