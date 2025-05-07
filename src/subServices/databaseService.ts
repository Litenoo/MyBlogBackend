import { PrismaClient, Prisma } from "../../prisma/generated/client";
import type { Post, PostTag } from "@prisma/client"
import * as valid from "./databaseService.schema";

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

    async insertPost(params: { title: string, content: string, published?: boolean, tags?: string[] }) //make tags work properly
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
            const { title, content, published, tags } = validation.data;
            // Database query
            const post: Post = await this.prisma.post.create({
                data: {
                    title,
                    content,
                    published,
                    tags: {
                        connectOrCreate: tags?.map(tag => ({
                            where: { tag },
                            create: { tag },
                        })),
                    }
                },
                include: { tags: true },
            });

            return { success: true, payload: { post } };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" };
        }
    }

    async insertTag(params: { tag: string }): Promise<Response<{ tag: PostTag }>> {
        const validation = valid.tagUploadSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }
        try {
            const tag: PostTag = await this.prisma.postTag.create({
                data: validation.data, //DEV returns posts that are having the same tag. Including unpublished ones.
            });
            return { success: true, payload: { tag } }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" }
        }
    }

    async searchTags(params: { searchString: string }): Promise<Response<PostTag[]>> {
        const validation = valid.tagSearchSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message };
        }
        try {
            const tags: PostTag[] = await this.prisma.postTag.findMany({
                where: {
                    tag: {
                        contains: params.searchString,
                        mode: "insensitive"
                    }
                }
            });
            return { success: true, payload: tags };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" };
        }
    }

    async getPostById(params: { postId: number })
        : Promise<Response<{ post: Post | null }>> {
        try {
            const post: Post | null = await this.prisma.post.findUnique({
                where: {
                    id: params.postId,
                }
            });

            return { success: true, payload: { post: post } }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" };
        }
    }

    //This function is made for searchBar, which does suggest posts and tags related to posts to make searching easier
    async getPostSnippets(params: { quantity: number, tags: string[], keyword: string })
        : Promise<Response<{ postTags: PostTag[], postCards: PostCard[] }>> {
        // Sync validation
        const validation = valid.postsTitleCardsSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }

        try {
            // Requests
            const keyword = params.keyword;
            const postTags: PostTag[] = (await this.searchTags({ searchString: keyword })).payload ?? [];

            const postCards: PostCard[] = await this.prisma.post.findMany({
                select: {
                    id: true,
                    title: true,
                    tags: { select: { tag: true } },
                    createdAt: true,
                },
                where: {
                    published: true,
                    tags: params.tags?.length > 0 ? {
                        some: {
                            tag: {
                                contains: validation.data.keyword,
                                mode: "insensitive",
                            }
                        }
                    } : undefined,
                },
            });
            return { success: true, payload: { postCards, postTags } }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: "Unexpected error occured" }
        }
    }
}