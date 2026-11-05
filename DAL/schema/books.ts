import { sql } from "drizzle-orm";
import {
    pgTable,
    integer,
    varchar,
    uniqueIndex
} from "drizzle-orm/pg-core";

import { auditColumns } from "./audit";
import { authors } from "./authors";
import { categories } from "./categories";

export const books = pgTable(
    "books",
    {
        id: integer("id")
            .primaryKey()
            .generatedAlwaysAsIdentity(),

        title: varchar("title", { length: 255 })
            .notNull(),

        publicationYear: integer("publication_year")
            .notNull(),

        imageUrl: varchar("image_url", { length: 2048 })
            .notNull(),

        authorId: integer("author_id")
            .notNull()
            .references(() => authors.id),

        categoryId: integer("category_id")
            .notNull()
            .references(() => categories.id),

        ...auditColumns
    },
    (table) => [
        uniqueIndex("books_active_title_unique")
            .on(sql`lower(btrim(${table.title}))`)
            .where(sql`not ${table.isDeleted}`)
    ]
);