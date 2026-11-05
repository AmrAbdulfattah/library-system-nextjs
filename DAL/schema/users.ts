
import {
    pgTable,
    integer,
    varchar,
    timestamp,
    uniqueIndex
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

export const users = pgTable(
    "users",
    {
        id: integer("id")
            .primaryKey()
            .generatedAlwaysAsIdentity(),

        email: varchar("email", { length: 255 })
            .notNull(),

        passwordHash: varchar("password_hash", {
            length: 255
        }).notNull(),

        role: varchar("role", { length: 20 })
            .notNull()
            .default("Admin"),

        createdAt: timestamp("created_at", {
            withTimezone: true
        })
            .notNull()
            .defaultNow()
    },
    (table) => [
        uniqueIndex("users_email_unique")
            .on(sql`lower(${table.email})`)
    ]
);
