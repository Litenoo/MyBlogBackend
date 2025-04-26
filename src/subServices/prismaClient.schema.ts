import { z } from "zod";

export const postUploadSchema = z.object({
    title: z.string()
        .min(2, "Title must be at least 2 characters")
        .max(128, "Title cannot exceed 128 characters"),
    content: z.string()
        .min(16, "Content must be at least 16 chacters"),
    published: z.boolean()
        .default(false),
}).strict();

export const postsTitleCardsSchema = z.object({
    quantity: z.number()
        .int("Invalid quantity of post cards")
        .positive("Invalid quantity of post cards")
        .max(100, "Maximum quantity of posts to load is 100"),
}).strict();