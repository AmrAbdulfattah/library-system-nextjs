
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";

import { db } from "../DAL/db";
import { users } from "../DAL/schema/users";

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "ADMIN_EMAIL and ADMIN_PASSWORD are required"
        );
    }

    if (
        email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error("Invalid ADMIN_EMAIL");
    }

    if (password.length < 12) {
        throw new Error(
            "ADMIN_PASSWORD must contain at least 12 characters"
        );
    }

    // Check whether an admin already exists
    const [existingAdmin] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "Admin"))
        .limit(1);

    if (existingAdmin) {
        console.log(
            "Admin already exists. Seeding skipped."
        );
        return;
    }

    // Check whether the email is already registered
    const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(
            sql`lower(${users.email}) = ${email}`
        )
        .limit(1);

    if (existingEmail) {
        throw new Error(
            "Email already exists but is not assigned as Admin"
        );
    }

    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1
    });

    const [admin] = await db
        .insert(users)
        .values({
            email,
            passwordHash,
            role: "Admin"
        })
        .onConflictDoNothing()
        .returning({
            id: users.id,
            email: users.email
        });

    if (!admin) {
        throw new Error(
            "Admin was not created because of a database conflict"
        );
    }

    console.log(
        `Admin created successfully: ${admin.email}`
    );
}

seedAdmin().catch((error: unknown) => {
    console.error(
        "Admin seeding failed:",
        error instanceof Error ? error.message : error
    );

    process.exitCode = 1;
});
