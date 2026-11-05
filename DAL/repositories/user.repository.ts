
import { eq, sql } from "drizzle-orm";

import { db } from "../db";
import { users } from "../schema/users";

export class UserRepository {
    async getByEmail(email: string) {
        const normalizedEmail = email.trim().toLowerCase();

        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                passwordHash: users.passwordHash,
                role: users.role
            })
            .from(users)
            .where(
                sql`lower(${users.email}) = ${normalizedEmail}`
            )
            .limit(1);

        return user ?? null;
    }

    async getById(id: number) {
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        return user ?? null;
    }
}
