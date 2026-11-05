
import { UserRepository } from "../../../../DAL/repositories/user.repository";
import { AuthService } from "../../../../services/auth.service";
import { loginSchema } from "../../../../schemas/auth.schema";
import { handleApiError } from "../../../../lib/api-error";


const authService = new AuthService(
    new UserRepository()
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Admin login
 *     description: Authenticate the admin and return a JWT access token valid for 5 hours.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Access denied
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Internal server error
 */
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
