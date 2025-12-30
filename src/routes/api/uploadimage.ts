import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";

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

					// Compress the image to stay under 10MB
					const compressedBuffer = await sharp(buffer)
						.resize(2400, 2400, {
							fit: "inside",
							withoutEnlargement: true,
						})
						.jpeg({ quality: 85 })
						.toBuffer();

					console.log(
						`Original size: ${buffer.length}, Compressed: ${compressedBuffer.length}`,
					);

					// Create form data for Cloudinary
					const cloudinaryForm = new FormData();
					cloudinaryForm.append(
						"file",
						new Blob([new Uint8Array(compressedBuffer)]),
						file.name,
					);
					cloudinaryForm.append("upload_preset", "riff_market_product");
					cloudinaryForm.append("folder", "product");

					// Upload directly to Cloudinary
					const cloudinaryResponse = await fetch(
						`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
						{
							method: "POST",
							body: cloudinaryForm,
						},
					);

					if (!cloudinaryResponse.ok) {
						const error = await cloudinaryResponse.json();
						console.error("Cloudinary error:", error);
						return new Response(
							JSON.stringify({
								error: error.error?.message || "Upload failed",
							}),
							{ status: 500 },
						);
					}

					const data = await cloudinaryResponse.json();

					return new Response(JSON.stringify({ url: data.secure_url }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
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
