
import {
    and,
    asc,
    count,
    eq,
    ne,
    sql,
    type SQL
} from "drizzle-orm";

import { db } from "../db";
import { books } from "../schema/books";
import { authors } from "../schema/authors";
import { categories } from "../schema/categories";

export type BookFilters = {
    pageNumber: number;
    pageSize: number;
    publicationYear?: number;
    authorId?: number;
    categoryId?: number;
};

export type CreateBookData = {
    title: string;
    publicationYear: number;
    imageUrl: string;
    authorId: number;
    categoryId: number;
    createdBy?: string | null;
};

export type UpdateBookData = {
    title: string;
    publicationYear: number;
    authorId: number;
    categoryId: number;
    updatedBy?: string | null;
};

export class BookRepository {

    async getAll(filters: BookFilters) {
        const {
            pageNumber,
            pageSize,
            publicationYear,
            authorId,
            categoryId
        } = filters;

        const conditions: SQL[] = [
            eq(books.isDeleted, false),
            eq(authors.isDeleted, false),
            eq(categories.isDeleted, false)
        ];

        if (publicationYear !== undefined) {
            conditions.push(
                eq(books.publicationYear, publicationYear)
            );
        }

        if (authorId !== undefined) {
            conditions.push(
                eq(books.authorId, authorId)
            );
        }

        if (categoryId !== undefined) {
            conditions.push(
                eq(books.categoryId, categoryId)
            );
        }

        const condition = and(...conditions);

        const [data, totalResult] = await Promise.all([
            db
                .select({
                    id: books.id,
                    title: books.title,
                    publicationYear: books.publicationYear,
                    imageUrl: books.imageUrl,

                    authorId: books.authorId,
                    authorName: authors.name,

                    categoryId: books.categoryId,
                    categoryName: categories.name,

                    createdAt: books.createdAt,
                    createdBy: books.createdBy,
                    updatedAt: books.updatedAt,
                    updatedBy: books.updatedBy,
                    isDeleted: books.isDeleted
                })
                .from(books)
                .innerJoin(
                    authors,
                    eq(books.authorId, authors.id)
                )
                .innerJoin(
                    categories,
                    eq(books.categoryId, categories.id)
                )
                .where(condition)
                .orderBy(asc(books.id))
                .limit(pageSize)
                .offset((pageNumber - 1) * pageSize),

            db
                .select({
                    totalCount: count()
                })
                .from(books)
                .innerJoin(
                    authors,
                    eq(books.authorId, authors.id)
                )
                .innerJoin(
                    categories,
                    eq(books.categoryId, categories.id)
                )
                .where(condition)
        ]);

        const totalCount =
            totalResult[0]?.totalCount ?? 0;

        return {
            data,
            pageNumber,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }
async existsByTitle(
    title: string,
    excludeId?: number
): Promise<boolean> {

    const conditions = [
        eq(books.isDeleted, false),
        sql`lower(btrim(${books.title})) =
            lower(btrim(${title}))`
    ];

    if (excludeId !== undefined) {
        conditions.push(ne(books.id, excludeId));
    }

    const [book] = await db
        .select({ id: books.id })
        .from(books)
        .where(and(...conditions))
        .limit(1);

    return book !== undefined;
}
    async getById(id: number) {
        const [book] = await db
            .select({
                id: books.id,
                title: books.title,
                publicationYear: books.publicationYear,
                imageUrl: books.imageUrl,

                authorId: books.authorId,
                authorName: authors.name,

                categoryId: books.categoryId,
                categoryName: categories.name,

                createdAt: books.createdAt,
                createdBy: books.createdBy,
                updatedAt: books.updatedAt,
                updatedBy: books.updatedBy,
                isDeleted: books.isDeleted
            })
            .from(books)
            .innerJoin(
                authors,
                eq(books.authorId, authors.id)
            )
            .innerJoin(
                categories,
                eq(books.categoryId, categories.id)
            )
            .where(
                and(
                    eq(books.id, id),
                    eq(books.isDeleted, false),
                    eq(authors.isDeleted, false),
                    eq(categories.isDeleted, false)
                )
            )
            .limit(1);

        return book ?? null;
    }

    async add(data: CreateBookData) {
        const [book] = await db
            .insert(books)
            .values({
                title: data.title.trim(),
                publicationYear: data.publicationYear,
                imageUrl: data.imageUrl,
                authorId: data.authorId,
                categoryId: data.categoryId,
                createdBy: data.createdBy ?? null
            })
            .returning();

        return book;
    }

    async update(
        id: number,
        data: UpdateBookData
    ) {
        const [book] = await db
            .update(books)
            .set({
                title: data.title.trim(),
                publicationYear: data.publicationYear,
                authorId: data.authorId,
                categoryId: data.categoryId,
                updatedAt: new Date(),
                updatedBy: data.updatedBy ?? null
            })
            .where(
                and(
                    eq(books.id, id),
                    eq(books.isDeleted, false)
                )
            )
            .returning();

        return book ?? null;
    }

    async updateImage(
        id: number,
        newImageUrl: string,
        oldImageUrl: string,
        updatedBy: string | null = null
    ) {
        const [book] = await db
            .update(books)
            .set({
                imageUrl: newImageUrl,
                updatedAt: new Date(),
                updatedBy
            })
            .where(
                and(
                    eq(books.id, id),
                    eq(books.isDeleted, false),
                    eq(books.imageUrl, oldImageUrl)
                )
            )
            .returning();

        return book ?? null;
    }

    async softDelete(
        id: number,
        updatedBy: string | null = null
    ) {
        const [book] = await db
            .update(books)
            .set({
                isDeleted: true,
                updatedAt: new Date(),
                updatedBy
            })
            .where(
                and(
                    eq(books.id, id),
                    eq(books.isDeleted, false)
                )
            )
            .returning();

        return book ?? null;
    }
}
