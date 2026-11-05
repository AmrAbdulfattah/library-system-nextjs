

import { BookRepository } from "../../../../../DAL/repositories/book.repository";
import { AuthorRepository } from "../../../../../DAL/repositories/author.repository";
import { CategoryRepository } from "../../../../../DAL/repositories/category.repository";

import { BookService } from "../../../../../services/book.service";
import { ImageService } from "../../../../../services/image.service";

import { bookIdSchema } from "../../../../../schemas/book.schema";
import { handleApiError } from "../../../../../lib/api-error";
import { requireAdmin } from "../../../../../lib/auth";

const bookService = new BookService(
    new BookRepository(),
    new AuthorRepository(),
    new CategoryRepository(),
    new ImageService()
);

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/books/{id}/image:
 *   patch:
 *     tags:
 *       - Books
 *     summary: Replace book image
 *     description: Admin only. Uploads a new image and replaces the previous one.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Book image replaced successfully
 *       400:
 *         description: Invalid image or ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Book not found
 *       409:
 *         description: Book was modified or deleted
 *       413:
 *         description: Image too large
 *       415:
 *         description: Unsupported content type
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const adminId = await requireAdmin(request);

        const { id } = await context.params;
        const idValidation = bookIdSchema.safeParse(id);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid book ID" },
                { status: 400 }
            );
        }

        const contentType =
            request.headers.get("content-type") ?? "";

        if (
            !contentType.toLowerCase()
                .startsWith("multipart/form-data")
        ) {
            return Response.json(
                {
                    message:
                        "Content-Type must be multipart/form-data"
                },
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

        const keys = [...formData.keys()];

        if (
            keys.length !== 1 ||
            keys[0] !== "image" ||
            formData.getAll("image").length !== 1
        ) {
            return Response.json(
                {
                    message: "Exactly one image file is required"
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

        const book = await bookService.replaceImage(
            idValidation.data,
            image,
            String(adminId)
        );

        return Response.json(book, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}
