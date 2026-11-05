

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
