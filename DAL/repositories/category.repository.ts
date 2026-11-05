
import {
    and,
    asc,
    count,
    eq,
    ne,
    sql
} from "drizzle-orm";

import { db } from "../db";
import { categories } from "../schema/categories";
import { books } from "../schema/books";

export type CreateCategoryData = {
    name: string;
    createdBy?: string | null;
};

export type UpdateCategoryData = {
    name: string;
    updatedBy?: string | null;
};

export class CategoryRepository {

    async getAll(
        pageNumber: number = 1,
        pageSize: number = 10
    ) {
        const condition = eq(categories.isDeleted, false);

        const [data, totalResult] = await Promise.all([
            db
                .select()
                .from(categories)
                .where(condition)
                .orderBy(asc(categories.id))
                .limit(pageSize)
                .offset((pageNumber - 1) * pageSize),

            db
                .select({ totalCount: count() })
                .from(categories)
                .where(condition)
        ]);

        const totalCount = totalResult[0]?.totalCount ?? 0;

        return {
            data,
            pageNumber,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async getById(id: number) {
        const [category] = await db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.id, id),
                    eq(categories.isDeleted, false)
                )
            )
            .limit(1);

        return category ?? null;
    }

    async existsByName(
        name: string,
        excludeId?: number
    ) {
        const conditions = [
            eq(categories.isDeleted, false),
            sql`lower(btrim(${categories.name})) =
                lower(btrim(${name}))`
        ];

        if (excludeId !== undefined) {
            conditions.push(ne(categories.id, excludeId));
        }

        const [category] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(and(...conditions))
            .limit(1);

        return category !== undefined;
    }

    async hasActiveBooks(categoryId: number) {
        const [book] = await db
            .select({ id: books.id })
            .from(books)
            .where(
                and(
                    eq(books.categoryId, categoryId),
                    eq(books.isDeleted, false)
                )
            )
            .limit(1);

        return book !== undefined;
    }

    async add(data: CreateCategoryData) {
        const [category] = await db
            .insert(categories)
            .values({
                name: data.name.trim(),
                createdBy: data.createdBy ?? null
            })
            .onConflictDoNothing()
            .returning();

        return category ?? null;
    }

    async update(
        id: number,
        data: UpdateCategoryData
    ) {
        const [category] = await db
            .update(categories)
            .set({
                name: data.name.trim(),
                updatedAt: new Date(),
                updatedBy: data.updatedBy ?? null
            })
            .where(
                and(
                    eq(categories.id, id),
                    eq(categories.isDeleted, false)
                )
            )
            .returning();

        return category ?? null;
    }

    async softDelete(
        id: number,
        updatedBy: string | null = null
    ) {
        const [category] = await db
            .update(categories)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
                updatedBy
            })
            .where(
                and(
                    eq(categories.id, id),
                    eq(categories.isDeleted, false)
                )
            )
            .returning();

        return category ?? null;
    }
}
