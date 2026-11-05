
export class AppError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

export function isUniqueViolation(error: unknown): boolean {
    let current: unknown = error;

    for (let i = 0; i < 10; i++) {
        if (
            current === null ||
            typeof current !== "object"
        ) {
            return false;
        }

        if (
            "code" in current &&
            current.code === "23505"
        ) {
            return true;
        }

        current = "cause" in current
            ? current.cause
            : null;
    }

    return false;
}

export function handleApiError(error: unknown): Response {
    // Handle known business errors
    if (error instanceof AppError) {
        return Response.json(
            {
                message: error.message
            },
            {
                status: error.status
            }
        );
    }

    // Driver errors can contain SQL parameters and connection credentials.
    console.error("Unexpected API error");

    return Response.json(
        {
            message: "Internal Server Error"
        },
        {
            status: 500
        }
    );
}
