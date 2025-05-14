import { PrismaClient } from "../../prisma/generated/client";
import type { Post, PostTag } from "@prisma/client";

import logger from "../logger";

//external schemas file
import * as s from "./services.schama";
import msg from "./infoMessages.json";

export default class Client {
    protected prisma: PrismaClient;

    constructor(prisma: PrismaClient = new PrismaClient()) {
        this.prisma = prisma;
    }

    public get prismaClient() { // Only for testing
        return this.prisma;
    }

    async insertPost(params: { title: string, content: string, published?: boolean, tags?: string[] }) //make tags work properly
        : Promise<s.Response<{ post: Post }>> {

        if (params.published === undefined) {
            params.published = false;
        }

        // Sync validation        
        const validation = s.postUploadSchema.safeParse(params);
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

            return { success: true, message: msg.success.POST_INSERT, payload: { post } };
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR };
        }
    }

    async editPost(params: { postId: number, data: s.EditPostParams }): Promise<s.Response<{ post: Post | null }>> {
        try {
            const post: Post | null = await this.prisma.post.findUnique({
                where: {
                    id: params.postId,
                }
            });

            if (!post) {
                return { success: false, message: msg.failure.INCORRECT_POST_ID };
            }

            const mergedPost = { ...post, ...params.data };


            const validation = s.postEditSchema.safeParse(mergedPost);
            if (!validation.success) {
                return { success: false, message: validation.error.errors[0]?.message } //Dev i think that if failure it will still be 200, check it
            }

            const { title, content, published, tags } = validation.data;

            const updatedPost: Post | null = await this.prisma.post.update({
                where: { id: params.postId },
                data: {
                    title, content, published, tags: {
                        set: [],
                        connectOrCreate: tags?.map(tag => ({
                            where: { tag },
                            create: { tag },
                        })),
                    }
                },
                include: {
                    tags: true,
                }
            });

            return { success: true, message: msg.success.POST_PUBLISH, payload: { post: updatedPost } }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR };
        }
    }

    async insertTag(params: { tag: string }): Promise<s.Response<{ tag: PostTag }>> {
        const validation = s.tagUploadSchema.safeParse(params);
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
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR }
        }
    }

    async searchTags(params: { searchString: string }): Promise<s.Response<PostTag[]>> {
        const validation = s.tagSearchSchema.safeParse(params);
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
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR };
        }
    }

    async getPostById(params: { postId: number })
        : Promise<s.Response<{ post: Post | null }>> {
        try {
            const post: Post | null = await this.prisma.post.findUnique({
                where: {
                    id: params.postId,
                    published: true,
                },
                include: {
                    tags: true,
                }
            });

            if (!post) {
                return { success: false, message: "No post with given id" };
            }

            return { success: true, payload: { post: post } }
        } catch (err) {
            logger.error((err as Error).stack);
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR };
        }
    }

    //This function is made for searchBar, which does suggest posts and tags related to posts to make searching easier
    async getPostSnippets(params: { quantity: number, tags: string[], keyword: string })
        : Promise<s.Response<{ postTags: PostTag[], postCards: s.PostCard[] }>> {
        // Sync validation
        const validation = s.postsTitleCardsSchema.safeParse(params);
        if (!validation.success) {
            return { success: false, message: validation.error.errors[0]?.message }
        }

        try {
            // Requests
            const keyword = params.keyword;
            const postTags: PostTag[] = (await this.searchTags({ searchString: keyword })).payload ?? [];

            const postCards: s.PostCard[] = await this.prisma.post.findMany({
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
            return { success: false, message: msg.failure.INTERNAL_SERVER_ERROR }
        }
    }
}