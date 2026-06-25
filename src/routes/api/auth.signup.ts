import { createFileRoute } from "@tanstack/react-router";
import { requestLoggerMiddleware } from "@/middleware";
import {
	signUpAccountService,
	toPublicAuthResponse,
} from "@/server/account-auth-service";
import type { SignUpRequest } from "@/types/auth";
import { useAppSession as getAppSession } from "@/utils/session";

export const Route = createFileRoute("/api/auth/signup")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as SignUpRequest;
					const newUser = await signUpAccountService(body);

					if ("error" in newUser) {
						return new Response(JSON.stringify({ error: newUser.error }), {
							status: 400,
						});
					}

					const session = await getAppSession();
					await session.update({
						userId: newUser.user.id,
						role: newUser.user.role,
					});

					return new Response(JSON.stringify(toPublicAuthResponse(newUser)), {
						status: 201,
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
