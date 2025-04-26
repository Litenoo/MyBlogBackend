import { z } from "zod";

export const userCreateSchema = z.object({
    nickname: z.string()
        .min(2, "The nickname length must be greater than 2")
        .max(32, "The nickname length must be lesser than 32")
        .regex( // Removes illegal characters
            /^[a-zA-Z0-9_]+$/,
            "Only letters, numbers and underscores allowed"
        )
        .transform(s => s.trim()), // trim output
    email: z.string()
        .email("Invalid email format")
        .max(120)
        .transform(s => s.trim())
}).strict();

export const postUploadSchema = z.object({
    title: z.string()
        .min(2, "Title must be at least 2 characters")
        .max(128, "Title cannot exceed 128 characters"),
    content: z.string()
        .min(16, "Content must be at least 16 chacters"),
    published: z.boolean()
        .default(false),
    authorId: z.number()
        .int("Invalid author id")
        .positive("Invalid author id")
}).strict();

export const postsTitleCardsSchema = z.object({
    quantity: z.number()
        .int("Invalid quantity of post cards")
        .positive("Invalid quantity of post cards")
        .max(100, "Maximum quantity of posts to load is 100"),
}).strict();