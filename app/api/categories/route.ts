

import { CategoryRepository } from "../../../DAL/repositories/category.repository";
import { CategoryService } from "../../../services/category.service";
import {
    categoryPaginationSchema,
    createCategorySchema
} from "../../../schemas/category.schema";
import { handleApiError } from "../../../lib/api-error";
import { requireAdmin } from "../../../lib/auth";

const categoryService = new CategoryService(
    new CategoryRepository()
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories with pagination
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
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const validation = categoryPaginationSchema.safeParse({
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

        const result = await categoryService.getAll(
            validation.data.pageNumber,
            validation.data.pageSize
        );

        return Response.json(result, { status: 200 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create category
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Category already exists
 *       500:
 *         description: Internal server error
 */
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

        const validation = createCategorySchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const category = await categoryService.add({
            name: validation.data.name,
            createdBy: String(adminId)
        });

        return Response.json(category, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
