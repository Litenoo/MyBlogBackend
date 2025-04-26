import { PrismaClient, Prisma } from "@prisma/client";
import type { Post, Author } from "@prisma/client"
import * as valid from "./prismaClient.schema";

import logger from "../logger";

interface Response<T> {
    success: boolean,
    message?: string,
    payload?: T,
}

// Type for card of post (For example searchbar results : only title and important things)
type PostCard = Prisma.PostGetPayload<{
    select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { nickname: true } }  // Only author's nickname
        tags: { select: { tag: true } }         // Only tag name
    }
}>;

export default class Client {
    protected prisma = new PrismaClient();

    public get prismaClient() { // Only for testing
        return this.prisma;
    }

    async addAuthor(params: { nickname: string, email: string })
        : Promise<Response<undefined>> {
        // sync validation
        const validation = valid.userCreateSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message };
        }

        const { nickname, email } = validation.data;

        // async operations and business logic
        try {
            //Check existance
            const existingAuthor = await this.prisma.author.findFirst({
                where: {
                    OR: [
                        { nickname: nickname },
                        { email: email },
                    ]
                },
                select: {
                    nickname: true,
                    email: true,
                }
            });

            if (existingAuthor && existingAuthor.email === email) {
                return {
                    success: false,
                    message: `The email "${email}" is already in use.`
                }
            } else if (existingAuthor && existingAuthor.nickname === nickname) {
                return {
                    success: false,
                    message: `The nickname "${nickname}" is already taken`,
                }
            }
            // Insert user
            await this.prisma.author.create({
                data: {
                    nickname: nickname, // Nickname of the author (visible for users)
                    email: email,
                }
            });

            return { success: true, message: "Author registered successfully" }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: (err as Error).message }
        }
    }

    async addPost(params: { title: string, content: string, published: boolean, authorId: number })
        : Promise<Response<{ postId: number }>> {
        // Sync validation        
        const validation = valid.postUploadSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }

        try {
            // Database query
            const post = await this.prisma.post.create({
                data: validation.data,
            });

            return { success: true, payload: { postId: post.id } };
        } catch (err) {
            logger.error((err as Error).stack);

            const prismaError = err as Prisma.PrismaClientKnownRequestError;
            if (prismaError.code === "P2003") { // Foreign key does not exists, the only Foreign key is author
                return { success: false, message: "Author does not exist" };
            }

            return { success: false, message: "Unexpected error occured" };
        }
    }

    async getPostById(params: { postId: number })
        : Promise<Response<Post | null>> {
        try {
            const payload = await this.prisma.post.findUnique({
                where: {
                    id: params.postId,
                }
            });

            return { success: true, payload: payload }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" };
        }
    }

    async getPostsTitleCards(params: { quantity: number, requirements: {} }) {
        // Sync validation
        const validation = valid.postsTitleCardsSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }

        try {
            // Request
            const postCards: PostCard[] = await this.prisma.post.findMany({
                select: {
                    id: true,
                    title: true,
                    author: { select: { nickname: true } },
                    tags: { select: { tag: true } },
                    createdAt: true,
                },
                where: { published: true },
                orderBy: { createdAt: 'desc' },
            });
            return { success: true, payload: postCards }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" }
        }
    }

    // REFACTOR THOSE

    // async getCardsByTag(tags: string[]) {
    //     return this.prisma.post.findMany({
    //         where: { tags: { some: { tag: { in: tags, } } } }
    //     }) || null;
    // }

    // async searchForPost(query: string) {
    //     const tags = await this.prisma.postTag.findMany({
    //         where: {
    //             tag: { contains: query, mode: 'insensitive' }
    //         }
    //     });

    //     const posts = await this.prisma.post.findMany({
    //         where: {
    //             title: { contains: query, mode: 'insensitive' }
    //         }
    //     });
    //     return [...tags, ...posts];
    // }

    // async getAllPostsCards() { //edit to send only neccessary info
    //     return await this.prisma.post.findMany();
    // }

    // async disconnect() {
    //     try {
    //         await this.prisma.$disconnect();
    //     } catch (err) {
    //         logger.error((err as Error).stack);
    //     }
    // }
}