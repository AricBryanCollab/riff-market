import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { uploadImage } from "@/utils/cloudinary";

export const Route = createFileRoute("/api/uploadimage")({
	server: {
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

					const arrayBuffer = await file.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);

					const originalName = (file as any).name || "upload.jpg";
					const ext = originalName.includes(".")
						? originalName.split(".").pop()
						: "jpg";
					const tmpName = `upload-${Date.now()}-${Math.random()
						.toString(36)
						.slice(2)}.${ext}`;
					const tmpPath = path.join(os.tmpdir(), tmpName);

					await fs.writeFile(tmpPath, buffer);

					try {
						const imageUrl = await uploadImage({
							filePath: tmpPath,
							folder: "product",
							deleteLocalFile: true,
						});

						return new Response(JSON.stringify({ url: imageUrl }), {
							status: 200,
						});
					} catch (uploadErr) {
						try {
							await fs.unlink(tmpPath).catch(() => {});
						} catch {}
						console.error("Cloudinary upload failed:", uploadErr);
						return new Response(
							JSON.stringify({
								error:
									uploadErr instanceof Error
										? uploadErr.message
										: "Upload to Cloudinary failed",
							}),
							{ status: 500 },
						);
					}
				} catch (err) {
					console.error("Upload error:", err);
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
