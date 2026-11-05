
import { UserRepository } from "../../../../DAL/repositories/user.repository";
import { AuthService } from "../../../../services/auth.service";
import { loginSchema } from "../../../../schemas/auth.schema";
import { handleApiError } from "../../../../lib/api-error";

const authService = new AuthService(
    new UserRepository()
);

export async function POST(request: Request) {
    try {
        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                { message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return Response.json(
                {
                    message: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            );
        }

        const result = await authService.login(
            validation.data
        );

        return Response.json(result, {
            status: 200,
            headers: {
                "Cache-Control": "no-store"
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}
