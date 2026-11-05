
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
