import {
    and,
    asc,
    count,
    eq,
    ne,
    sql
} from "drizzle-orm";

import { db } from "../db";
import { authors } from "../schema/authors";
import { books } from "../schema/books";

export type CreateAuthorData = {
    name: string;
    createdBy?: string | null;
};

export type UpdateAuthorData = {
    name: string;
    updatedBy?: string | null;
};

export class AuthorRepository {

    async getAll(pageNumber = 1, pageSize = 10) {
        const condition = eq(authors.isDeleted, false);

        const [data, totalResult] = await Promise.all([
            db.select()
                .from(authors)
                .where(condition)
                .orderBy(asc(authors.id))
                .limit(pageSize)
                .offset((pageNumber - 1) * pageSize),

            db.select({ totalCount: count() })
                .from(authors)
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
        const [author] = await db.select()
            .from(authors)
            .where(and(
                eq(authors.id, id),
                eq(authors.isDeleted, false)
            ))
            .limit(1);

        return author ?? null;
    }

    async existsByName(name: string, excludeId?: number) {
        const conditions = [
            eq(authors.isDeleted, false),
            sql`lower(btrim(${authors.name})) =
                lower(btrim(${name}))`
        ];

        if (excludeId !== undefined) {
            conditions.push(ne(authors.id, excludeId));
        }

        const [author] = await db
            .select({ id: authors.id })
            .from(authors)
            .where(and(...conditions))
            .limit(1);

        return author !== undefined;
    }

    async hasActiveBooks(authorId: number) {
        const [book] = await db
            .select({ id: books.id })
            .from(books)
            .where(and(
                eq(books.authorId, authorId),
                eq(books.isDeleted, false)
            ))
            .limit(1);

        return book !== undefined;
    }

   async add(data: CreateAuthorData) {
    const [author] = await db
        .insert(authors)
        .values({
            name: data.name.trim(),
            createdBy: data.createdBy ?? null
        })
        .onConflictDoNothing()
        .returning();

    return author ?? null;
}

    async update(id: number, data: UpdateAuthorData) {
        const [author] = await db.update(authors)
            .set({
                name: data.name,
                updatedAt: new Date(),
                updatedBy: data.updatedBy ?? null
            })
            .where(and(
                eq(authors.id, id),
                eq(authors.isDeleted, false)
            ))
            .returning();

        return author ?? null;
    }

    async softDelete(
        id: number,
        updatedBy: string | null = null
    ) {
        const [author] = await db.update(authors)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
                updatedBy
            })
            .where(and(
                eq(authors.id, id),
                eq(authors.isDeleted, false)
            ))
            .returning();

        return author ?? null;
    }
}