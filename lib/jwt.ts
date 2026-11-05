
import {
    SignJWT,
    jwtVerify,
    type JWTPayload
} from "jose";

const JWT_ISSUER = "library-system";
const JWT_AUDIENCE = "library-system-api";

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
        throw new Error(
            "JWT_SECRET must be configured with at least 32 bytes"
        );
    }

    return new TextEncoder().encode(secret);
}

export type AuthTokenPayload = JWTPayload & {
    role: string;
};

export async function generateAccessToken(
    user: {
        id: number;
        email: string;
        role: string;
    }
): Promise<string> {
    return new SignJWT({
        role: user.role
    })
        .setProtectedHeader({
            alg: "HS256",
            typ: "JWT"
        })
        .setSubject(String(user.id))
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime("5h")
        .sign(getJwtSecret());
}

export async function verifyAccessToken(
    token: string
): Promise<AuthTokenPayload> {
    const { payload } = await jwtVerify(
        token,
        getJwtSecret(),
        {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: ["HS256"]
        }
    );

    if (
        typeof payload.sub !== "string" ||
        !/^[1-9]\d*$/.test(payload.sub) ||
        !Number.isSafeInteger(Number(payload.sub)) ||
        typeof payload.role !== "string"
    ) {
        throw new Error("Invalid token payload");
    }

    return payload as AuthTokenPayload;
}
