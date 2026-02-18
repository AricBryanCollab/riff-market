import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";
import { unsignedUploadImage } from "@/utils/cloudinary";
import { compressImage } from "@/utils/compress-image";

export const Route = createFileRoute("/api/uploadimage")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: {
			POST: async ({ request }) => {
				try {
					const form = await request.formData();
					const file = form.get("image") as File | null;

					if (!file) {
						return new Response(JSON.stringify({ error: "No file provided" }), {
							status: 400,
						});
					}

					const { buffer } = await compressImage({
						file,
					});

					const cloudinaryResult = await unsignedUploadImage({
						buffer,
						filename: file.name,
						uploadPreset: "riff_market",
						folder: "product",
					});

					return Response.json(
						{ url: cloudinaryResult.secure_url },
						{ status: 200 },
					);
				} catch (err) {
					logger.error("Upload error", err);
					return new Response(
						JSON.stringify({
							error: err instanceof Error ? err.message : "Failed to upload",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
