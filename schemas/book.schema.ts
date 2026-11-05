
import { z } from "zod";

const currentYear = new Date().getFullYear();

const bookFields = {
    title: z
        .string()
        .trim()
        .min(1, "Book title is required")
        .max(255, "Book title cannot exceed 255 characters"),

    publicationYear: z
        .number()
        .int("Publication year must be an integer")
        .min(1, "Publication year must be greater than zero")
        .max(currentYear, "Publication year cannot be in the future"),

    authorId: z
        .number()
        .int()
        .positive("Invalid author ID")
        .refine(Number.isSafeInteger, "Invalid author ID"),

    categoryId: z
        .number()
        .int()
        .positive("Invalid category ID")
        .refine(Number.isSafeInteger, "Invalid category ID")
};

export const createBookSchema = z.strictObject({
    title: bookFields.title,

    publicationYear: z.coerce.number()
        .int()
        .min(1)
        .max(currentYear),

    authorId: z.coerce.number()
        .int()
        .positive()
        .refine(Number.isSafeInteger),

    categoryId: z.coerce.number()
        .int()
        .positive()
        .refine(Number.isSafeInteger)
});

export const updateBookSchema = z.strictObject(bookFields);

export const bookIdSchema = z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid book ID")
    .transform(Number)
    .refine(Number.isSafeInteger, "Invalid book ID");

export const bookQuerySchema = z.strictObject({
    pageNumber: z.coerce.number()
        .int()
        .min(1)
        .default(1),

    pageSize: z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(10),

    publicationYear: z.coerce.number()
        .int()
        .min(1)
        .max(currentYear)
        .optional(),

    authorId: z.coerce.number()
        .int()
        .positive()
        .refine(Number.isSafeInteger)
        .optional(),

    categoryId: z.coerce.number()
        .int()
        .positive()
        .refine(Number.isSafeInteger)
        .optional()
});

export type CreateBookDto = z.infer<typeof createBookSchema>;
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
export type BookQueryDto = z.infer<typeof bookQuerySchema>;
