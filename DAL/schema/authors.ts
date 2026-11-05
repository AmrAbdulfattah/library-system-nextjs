import { sql } from "drizzle-orm";
import {
    pgTable,
    integer,
    varchar,
    uniqueIndex
} from "drizzle-orm/pg-core";

import { auditColumns } from "./audit";

export const authors = pgTable(
    "authors",
    {
        id: integer("id")
            .primaryKey()
            .generatedAlwaysAsIdentity(),

        name: varchar("name", { length: 255 })
            .notNull(),

        ...auditColumns
    },
    (table) => [
        uniqueIndex("authors_active_name_unique")
            .on(sql`lower(btrim(${table.name}))`)
            .where(sql`not ${table.isDeleted}`)
    ]
);