
import { BookRepository } from "../../../../DAL/repositories/book.repository";
import { AuthorRepository } from "../../../../DAL/repositories/author.repository";
import { CategoryRepository } from "../../../../DAL/repositories/category.repository";

import { BookService } from "../../../../services/book.service";
import { ImageService } from "../../../../services/image.service";

import {
    bookIdSchema,
    updateBookSchema
} from "../../../../schemas/book.schema";

import { handleApiError } from "../../../../lib/api-error";
import { requireAdmin } from "../../../../lib/auth";

const bookService = new BookService(
    new BookRepository(),
    new AuthorRepository(),
    new CategoryRepository(),
    new ImageService()
);

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function parseBookId(context: RouteContext) {
    const { id } = await context.params;
    return bookIdSchema.safeParse(id);
}

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     tags:
 *       - Books
 *     summary: Get book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid book ID
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const idValidation = await parseBookId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid book ID" },
                { status: 400 }
            );
        }

        const book = await bookService.getById(
            idValidation.data
        );

        return Response.json(book, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     tags:
 *       - Books
 *     summary: Update book details
 *     description: Admin only. Updates book details without changing its image.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBook'
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       400:
 *         description: Invalid ID or request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Book, author or category not found
 *       409:
 *         description: Duplicate title or invalid relation
 *       500:
 *         description: Internal server error
 */
export async function PUT(
    request: Request,
    context: RouteContext
) {
    try {
        const adminId = await requireAdmin(request);

        const idValidation = await parseBookId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid book ID" },
                { status: 400 }
            );
        }

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                { message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const validation = updateBookSchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const book = await bookService.update(
            idValidation.data,
            {
                ...validation.data,
                updatedBy: String(adminId)
            }
        );

        return Response.json(book, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     tags:
 *       - Books
 *     summary: Soft delete book
 *     description: Admin only. Marks a book as deleted.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Book soft deleted successfully
 *       400:
 *         description: Invalid book ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const adminId = await requireAdmin(request);

        const idValidation = await parseBookId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid book ID" },
                { status: 400 }
            );
        }

        await bookService.softDelete(
            idValidation.data,
            String(adminId)
        );

        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
