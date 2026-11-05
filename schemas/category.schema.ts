
import { z } from "zod";

export const createCategorySchema = z.strictObject({
    name: z
        .string()
        .trim()
        .min(1, "Category name is required")
        .max(255, "Category name cannot exceed 255 characters")
});

export const updateCategorySchema = createCategorySchema;

export const categoryIdSchema = z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid category ID")
    .transform(Number)
    .refine(Number.isSafeInteger, "Invalid category ID");

const paginationNumber = (defaultValue: number) =>
    z.union([z.string(), z.number()])
        .transform(Number)
        .pipe(z.number().int().min(1))
        .default(defaultValue);

export const categoryPaginationSchema = z.object({
    pageNumber: paginationNumber(1),
    pageSize: paginationNumber(10).pipe(
        z.number().max(100)
    )
});

export type CreateCategoryDto =
    z.infer<typeof createCategorySchema>;

export type UpdateCategoryDto =
    z.infer<typeof updateCategorySchema>;
