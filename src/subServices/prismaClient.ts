// packages
import { PrismaClient } from "@prisma/client";
import validator from "validator";

// outer files
import logger from "../logger";

export default class Client {
    protected prisma = new PrismaClient();

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

    async addPost(title: string, content: string, published: boolean, authorId: number) {
        try {
            // Validation

            if (!title || !content || !published || !authorId) {
                logger.error(new Error(`Missing variables (title, content, published, authorId)`).stack);
                return;
            }

            if (!validator.isLength(title, { min: 2, max: 128 })) {
                logger.error(new Error(`Title is to long (max 128 characters)`).stack);
                return;
            }

            // Database query
            await this.prisma.post.create({
                data: {
                    title, // Title of post
                    content, // HTML content of post
                    published, // Could be visible for users
                    authorId, // Id of the author of post
                }
            });
        } catch (err) {
            logger.error((err as Error).stack);
        }
    }

    async disconnect() {
        try {
            await this.prisma.disconnect();
        } catch (err) {
            logger.error((err as Error).stack);
        }
    }
}