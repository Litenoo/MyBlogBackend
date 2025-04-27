import { PrismaClient, Prisma } from "@prisma/client";
import type { Post } from "@prisma/client"
import * as valid from "./dbClient.schema";

import logger from "../logger";

export interface Response<T> {
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
        tags: { select: { tag: true } } // Only tag name
    }
}>;

export interface AddPostParams {
    title: string;
    content: string;
    published?: boolean;
}

export default class Client {
    protected prisma: PrismaClient;

    constructor(prisma: PrismaClient = new PrismaClient()) {
        this.prisma = prisma;
    }

    public get prismaClient() { // Only for testing
        return this.prisma;
    }

    async addPost(params: { title: string, content: string, published?: boolean, })
        : Promise<Response<{ post: Post }>> {
        // Sadly can't be done with auto assignment (equality sign in params)
        if (params.published === undefined) {
            params.published = false;
        }

        // Sync validation        
        const validation = valid.postUploadSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }

        try {
            // Database query
            const post: Post = await this.prisma.post.create({
                data: validation.data,
            });

            return { success: true, payload: { post } };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" };
        }
    }

    async getPostById(postId: number)
        : Promise<Response<{ post: Post | null }>> {
        try {
            const post: Post | null = await this.prisma.post.findUnique({
                where: {
                    id: postId,
                }
            });

            return { success: true, payload: { post: post } }
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