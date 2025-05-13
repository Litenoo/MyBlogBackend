import { z } from "zod";

export const responseFormat = z.object({
    success: z.boolean(),
    message: z.string(),
    payload: z.any(),
});