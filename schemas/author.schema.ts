import { z } from "zod";

export const createAuthorSchema = z.strictObject({
    name: z
        .string()
        .trim()
        .min(1, "Author name is required")
        .max(255, "Author name cannot exceed 255 characters")
});

export const updateAuthorSchema = createAuthorSchema;

export const authorIdSchema = z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid author ID")
    .transform(Number)
    .refine(Number.isSafeInteger, "Invalid author ID");

export const authorPaginationSchema = z.object({
    pageNumber: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export type CreateAuthorDto = z.infer<
    typeof createAuthorSchema
>;

export type UpdateAuthorDto = z.infer<
    typeof updateAuthorSchema
>;