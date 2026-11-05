
import { AppError } from "./api-error";
import { verifyAccessToken } from "./jwt";
import { UserRepository } from "../DAL/repositories/user.repository";

const userRepository = new UserRepository();

export async function requireAdmin(
    request: Request
): Promise<number> {

    // 1. Read Authorization header
    const authorization = request.headers.get("authorization");

    if (!authorization) {
        throw new AppError(
            401,
            "Authorization token is required"
        );
    }

    const match = /^Bearer ([^\s]+)$/i.exec(authorization);

    if (!match) {
        throw new AppError(
            401,
            "Invalid Authorization header"
        );
    }

    const token = match[1];

    let payload;

    try {
        payload = await verifyAccessToken(token);
    } catch {
        throw new AppError(
            401,
            "Invalid or expired token"
        );
    }

    if (payload.role !== "Admin") {
        throw new AppError(
            403,
            "Admin access required"
        );
    }

    const userId = Number(payload.sub);

    if (
        !Number.isSafeInteger(userId) ||
        userId <= 0
    ) {
        throw new AppError(
            401,
            "Invalid token"
        );
    }

    const user = await userRepository.getById(userId);

    if (!user) {
        throw new AppError(
            401,
            "User no longer exists"
        );
    }

    if (user.role !== "Admin") {
        throw new AppError(
            403,
            "Admin access required"
        );
    }

    return user.id;
}
