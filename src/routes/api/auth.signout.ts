import { createFileRoute } from "@tanstack/react-router";
import { signOutService } from "@/actions/auth";

export const Route = createFileRoute("/api/auth/signout")({
	server: {
		handlers: {
			POST: async () => {
				try {
					await signOutService();

					return new Response(
						JSON.stringify({ message: "Sign out is successful" }),
					);
				} catch (error) {
					console.error(error);
					return new Response(
						JSON.stringify({
							message: "Failed to sign out data",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
