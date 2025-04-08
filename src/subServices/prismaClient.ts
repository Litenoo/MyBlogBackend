import { PrismaClient } from "@prisma/client";
import validator, { contains } from "validator";

import logger from "../logger";

export default class Client {
    protected prisma = new PrismaClient();

    public get prismaClient() { // Only for testing
        return this.prisma;
    }

    async addAuthor(nickname: string, email: string) {
        try {
            // Validation
            if (!nickname || !email) {
                logger.error(new Error(`Missing param in (username, email)`).stack);
                return;
            }

            if (!validator.isEmail(email)) {
                logger.error(new Error(`The email format is not valid`).stack);
                return;
            }

            if (!validator.isLength(nickname, { min: 2, max: 32 })) {
                logger.error(new Error(`The nickname lenght could be 2 > and < 32`).stack);
                return;
            }

            // Database query
            await this.prisma.author.create({
                data: {
                    nickname, // Nicknme of the author (visible for users)
                    email, // Email of the author
                }
            });
        } catch (err) {
            logger.error((err as Error).stack);
        }
    }

    async addPost(title: string | undefined,
        content: string | undefined,
        published: boolean = false,
        authorId: number | undefined
    ): Promise<{ success: boolean, message?: string }> {
        try {
            // Validation
            if (!title || !content || !published || !authorId) {
                const errorMsg = `Missing variables (title, content, published, authorId)`;
                logger.error(new Error(errorMsg).stack);
                return { success: false, message: errorMsg };
            }

            if (!validator.isLength(title, { min: 2, max: 128 })) {
                const errorMsg = `Title is to long (max 128 characters)`;
                logger.error(new Error(errorMsg).stack);
                return { success: false, message: errorMsg };
            }

            const authorExists = await this.IfAuthorExists(authorId)
            if (!authorExists) {
                return { success: false, message: `Author does not exist` };
            }

            // Database query
            await this.prisma.post.create({
                data: {
                    title, // Title of post
                    content, // Markdown content of post
                    published, // Could be visible for users
                    authorId, // Id of the author of post 
                }
            });
            return { success: true };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: `Unexpected error occured. Please check logs or contact administrator` };
        }
    }

    async IfAuthorExists(id: number): Promise<boolean> {
        const author = await this.prisma.author.findUnique({
            where: { id }
        });

        return author ? true : false;
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