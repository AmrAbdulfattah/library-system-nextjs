import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is missing");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./DAL/schema/index.ts",
    out: "./drizzle",
    dbCredentials: {
        url: databaseUrl
    }
});
