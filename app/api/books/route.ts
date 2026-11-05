
import { BookRepository } from "../../../DAL/repositories/book.repository";
import { AuthorRepository } from "../../../DAL/repositories/author.repository";
import { CategoryRepository } from "../../../DAL/repositories/category.repository";

import { BookService } from "../../../services/book.service";
import { ImageService } from "../../../services/image.service";
import { requireAdmin } from "../../../lib/auth";
import {
    bookQuerySchema,
    createBookSchema
} from "../../../schemas/book.schema";

import { handleApiError } from "../../../lib/api-error";

const bookService = new BookService(
    new BookRepository(),
    new AuthorRepository(),
    new CategoryRepository(),
    new ImageService()
);

/**
 * @swagger
 * /api/books:
 *   get:
 *     tags:
 *       - Books
 *     summary: Get books with pagination and filters
 *   security:
 *   - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: publicationYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pageNumber:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Invalid filters
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const query = {
            pageNumber: searchParams.get("pageNumber") ?? 1,
            pageSize: searchParams.get("pageSize") ?? 10,
            ...(searchParams.has("publicationYear") && {
                publicationYear: searchParams.get("publicationYear")
            }),
            ...(searchParams.has("authorId") && {
                authorId: searchParams.get("authorId")
            }),
            ...(searchParams.has("categoryId") && {
                categoryId: searchParams.get("categoryId")
            })
        };

        const validation = bookQuerySchema.safeParse(query);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Invalid query parameters",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const filters = validation.data;

        if (
            ["publicationYear", "authorId", "categoryId"].some(
                key =>
                    searchParams.has(key) &&
                    searchParams.get(key)?.trim() === ""
            )
        ) {
            return Response.json(
                { message: "Filter values cannot be empty" },
                { status: 400 }
            );
        }

        const result = await bookService.getAll(filters);

        return Response.json(result, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/books:
 *   post:
 *     tags:
 *       - Books
 *     summary: Create book with image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - publicationYear
 *               - authorId
 *               - categoryId
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               publicationYear:
 *                 type: integer
 *               authorId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Author or category not found
 *       409:
 *         description: Invalid relation
 *       413:
 *         description: Image too large
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const adminId = await requireAdmin(request);

        const contentType = request.headers.get("content-type") ?? "";

        if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
            return Response.json(
                { message: "Content-Type must be multipart/form-data" },
                { status: 415 }
            );
        }

        let formData: FormData;

        try {
            formData = await request.formData();
        } catch {
            return Response.json(
                { message: "Invalid form data" },
                { status: 400 }
            );
        }

        const allowedFields = new Set([
            "title",
            "publicationYear",
            "authorId",
            "categoryId",
            "image"
        ]);

        for (const key of formData.keys()) {
            if (
                !allowedFields.has(key) ||
                formData.getAll(key).length !== 1
            ) {
                return Response.json(
                    { message: `Invalid or repeated field: ${key}` },
                    { status: 400 }
                );
            }
        }

        const validation = createBookSchema.safeParse({
            title: formData.get("title"),
            publicationYear: formData.get("publicationYear"),
            authorId: formData.get("authorId"),
            categoryId: formData.get("categoryId")
        });

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const image = formData.get("image");

        if (!(image instanceof File)) {
            return Response.json(
                { message: "Image file is required" },
                { status: 400 }
            );
        }

        const book = await bookService.add(
            {
                ...validation.data,
                createdBy: String(adminId)
            },
            image
        );

        return Response.json(book, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}
