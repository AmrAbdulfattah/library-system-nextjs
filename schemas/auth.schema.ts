
import { z } from "zod";

export const loginSchema = z.strictObject({
    email: z
        .email("Invalid email address")
        .trim()
        .toLowerCase()
        .max(255, "Email is too long"),

    password: z
        .string()
        .min(1, "Password is required")
});

export type LoginDto = z.infer<typeof loginSchema>;
