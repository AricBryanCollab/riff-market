import { createFileRoute } from "@tanstack/react-router";
import { getUserByIdService } from "@/actions/user";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/user")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			GET: async ({ context }) => {
				try {
					const userId = context.id;

					const user = await getUserByIdService(userId);

					return new Response(JSON.stringify(user));
				} catch (error) {
					console.error(error);
					return new Response(
						JSON.stringify({ message: "Failed to query user data" }),
						{ status: 500 },
					);
				}
			},
		},
	},
});
