

import { AuthorRepository } from "../../../../DAL/repositories/author.repository";
import { AuthorService } from "../../../../services/author.service";
import {
    authorIdSchema,
    updateAuthorSchema
} from "../../../../schemas/author.schema";
import { handleApiError } from "../../../../lib/api-error";
import { requireAdmin } from "../../../../lib/auth";

const authorService = new AuthorService(
    new AuthorRepository()
);

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function parseAuthorId(context: RouteContext) {
    const { id } = await context.params;
    return authorIdSchema.safeParse(id);
}

/**
 * @swagger
 * /api/authors/{id}:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Get author by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Author retrieved
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Author not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const idValidation = await parseAuthorId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid author ID" },
                { status: 400 }
            );
        }

        const author = await authorService.getById(
            idValidation.data
        );

        return Response.json(author, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/authors/{id}:
 *   put:
 *     tags:
 *       - Authors
 *     summary: Update author
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
 *             $ref: '#/components/schemas/CreateAuthor'
 *     responses:
 *       200:
 *         description: Author updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Author not found
 *       409:
 *         description: Author already exists
 *       500:
 *         description: Internal server error
 */
export async function PUT(
    request: Request,
    context: RouteContext
) {
    try {
        const adminId = await requireAdmin(request);

        const idValidation = await parseAuthorId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid author ID" },
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

        const validation = updateAuthorSchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const author = await authorService.update(
            idValidation.data,
            {
                name: validation.data.name,
                updatedBy: String(adminId)
            }
        );

        return Response.json(author, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/authors/{id}:
 *   delete:
 *     tags:
 *       - Authors
 *     summary: Soft delete author
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
 *         description: Author deleted
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Author not found
 *       409:
 *         description: Author has active books
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const adminId = await requireAdmin(request);

        const idValidation = await parseAuthorId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid author ID" },
                { status: 400 }
            );
        }

        await authorService.softDelete(
            idValidation.data,
            String(adminId)
        );

        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
