
import argon2 from "argon2";

import { UserRepository } from "../DAL/repositories/user.repository";
import { AppError } from "../lib/api-error";
import { generateAccessToken } from "../lib/jwt";
import type { LoginDto } from "../schemas/auth.schema";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository
    ) {}

    async login(data: LoginDto): Promise<{ accessToken: string }> {
        const email = data.email.trim().toLowerCase();

        const user = await this.userRepository.getByEmail(email);

        if (!user) {
            throw new AppError(
                401,
                "Invalid email or password"
            );
        }

        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            data.password
        );

        if (!isPasswordValid) {
            throw new AppError(
                401,
                "Invalid email or password"
            );
        }

        if (user.role !== "Admin") {
            throw new AppError(
                403,
                "Access denied"
            );
        }

        const accessToken = await generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        return { accessToken };
    }
}
