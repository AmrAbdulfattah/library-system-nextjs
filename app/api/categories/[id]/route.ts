

import { CategoryRepository } from "../../../../DAL/repositories/category.repository";
import { CategoryService } from "../../../../services/category.service";
import {
    categoryIdSchema,
    updateCategorySchema
} from "../../../../schemas/category.schema";
import { handleApiError } from "../../../../lib/api-error";
import { requireAdmin } from "../../../../lib/auth";

const categoryService = new CategoryService(
    new CategoryRepository()
);

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function parseCategoryId(context: RouteContext) {
    const { id } = await context.params;
    return categoryIdSchema.safeParse(id);
}

export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const idValidation = await parseCategoryId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid category ID" },
                { status: 400 }
            );
        }

        const category = await categoryService.getById(
            idValidation.data
        );

        return Response.json(category, { status: 200 });
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

        const idValidation = await parseCategoryId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid category ID" },
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

        const validation = updateCategorySchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const category = await categoryService.update(
            idValidation.data,
            {
                name: validation.data.name,
                updatedBy: String(adminId)
            }
        );

        return Response.json(category, { status: 200 });
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

        const idValidation = await parseCategoryId(context);

        if (!idValidation.success) {
            return Response.json(
                { message: "Invalid category ID" },
                { status: 400 }
            );
        }

        await categoryService.softDelete(
            idValidation.data,
            String(adminId)
        );

        return new Response(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
