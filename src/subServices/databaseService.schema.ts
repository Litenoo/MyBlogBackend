import { z } from "zod";

export const postUploadSchema = z.object({
    title: z.string()
        .min(2, "Title must be at least 2 characters")
        .max(128, "Title cannot exceed 128 characters"),
    content: z.string()
        .min(16, "Content must be at least 16 chacters"),
    published: z.boolean()
        .default(false),
    tags: z.array(z.string()).optional(),
}).strict();

export const tagUploadSchema = z.object({
    tag: z.string()
        .min(1, "No title passed")
        .max(32, "Title is too long. Maximum lenght is 32"),
}).strict();

export const tagSearchSchema = z.object({
    searchString: z.string()
        .min(1, "No searchString passed")
        .max(32, "SearchString is too long. Maximum length is 32")
}).strict();

export const postsTitleCardsSchema = z.object({
    quantity: z.number()
        .int("Invalid quantity of post cards")
        .positive("Invalid quantity of post cards")
        .max(100, "Maximum quantity of posts to load is 100"),
    tags: z.array(z.string()).optional(),
    keyword: z.string()
        .max(128, "Search query cannot be longer than 128 characters")
        .optional()
        .default(""),
}).strict();
