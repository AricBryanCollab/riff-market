import { createFileRoute } from "@tanstack/react-router";
import { updateUserProfilePicService } from "@/actions/user";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/user/profile-picture")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			PUT: async ({ request, context }) => {
				try {
					const userId = context.id;

					const formData = await request.formData();
					const profilePic = formData.get("profilePic") as File | null;

					if (!profilePic) {
						return new Response(
							JSON.stringify({
								error: "Profile picture file is required",
							}),
							{ status: 400 },
						);
					}

					const profilePicUrl = await updateUserProfilePicService(
						userId,
						profilePic,
					);

					return new Response(
						JSON.stringify({
							message: "Profile picture has been updated successfully",
							profilePic: profilePicUrl,
						}),
						{ status: 200 },
					);
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Failed to update profile picture",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
