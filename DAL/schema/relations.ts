import { relations } from "drizzle-orm";

import { books } from "./books";
import { authors } from "./authors";
import { categories } from "./categories";

export const booksRelations = relations(
    books,
    ({ one }) => ({
        author: one(authors, {
            fields: [books.authorId],
            references: [authors.id]
        }),

        category: one(categories, {
            fields: [books.categoryId],
            references: [categories.id]
        })
    })
);

export const authorsRelations = relations(
    authors,
    ({ many }) => ({
        books: many(books)
    })
);

export const categoriesRelations = relations(
    categories,
    ({ many }) => ({
        books: many(books)
    })
);