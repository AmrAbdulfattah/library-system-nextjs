import {
    boolean,
    timestamp,
    varchar
} from "drizzle-orm/pg-core";

export const auditColumns = {
    createdAt: timestamp("created_at", {
        withTimezone: true
    }).notNull().defaultNow(),

    createdBy: varchar("created_by", { length: 255 }),

    updatedAt: timestamp("updated_at", {
        withTimezone: true
    }),

    updatedBy: varchar("updated_by", { length: 255 }),

    isDeleted: boolean("is_deleted")
        .notNull()
        .default(false)
};