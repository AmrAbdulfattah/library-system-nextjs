
import { AuthorRepository } from "../../../DAL/repositories/author.repository";
import { AuthorService } from "../../../services/author.service";
import {
    createAuthorSchema,
    authorPaginationSchema
} from "../../../schemas/author.schema";
import { handleApiError } from "../../../lib/api-error";
import { requireAdmin } from "../../../lib/auth";

const authorService = new AuthorService(
    new AuthorRepository()
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const validation = authorPaginationSchema.safeParse({
            pageNumber: searchParams.get("pageNumber") ?? 1,
            pageSize: searchParams.get("pageSize") ?? 10
        });

        if (!validation.success) {
            return Response.json(
                {
                    message: "Invalid pagination parameters",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const result = await authorService.getAll(
            validation.data.pageNumber,
            validation.data.pageSize
        );

        return Response.json(result, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const adminId = await requireAdmin(request);

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                { message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const validation = createAuthorSchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const author = await authorService.add({
            name: validation.data.name,
            createdBy: String(adminId)
        });

        return Response.json(author, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
