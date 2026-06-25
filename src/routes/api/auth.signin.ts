import { createFileRoute } from "@tanstack/react-router";
import { requestLoggerMiddleware } from "@/middleware";
import {
	signInAccountService,
	toPublicAuthResponse,
} from "@/server/account-auth-service";
import type { SignInRequest } from "@/types/auth";
import { useAppSession as getAppSession } from "@/utils/session";

export const Route = createFileRoute("/api/auth/signin")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as SignInRequest;

					const authUser = await signInAccountService(body);

					if ("error" in authUser) {
						return new Response(JSON.stringify({ error: authUser.error }), {
							status: 400,
						});
					}

					const session = await getAppSession();
					await session.update({
						userId: authUser.user.id,
						role: authUser.user.role,
					});

					return new Response(JSON.stringify(toPublicAuthResponse(authUser)), {
						status: 200,
					});
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Invalid request data",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
