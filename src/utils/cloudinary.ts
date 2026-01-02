import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
});

interface ImageParams {
	buffer: Buffer;
	filename: string;
	uploadPreset: string;
	folder?: string;
}

export async function unsignedUploadImage(params: ImageParams) {
	const { buffer, filename, uploadPreset, folder } = params;

	const formData = new FormData();
	formData.append("file", new Blob([new Uint8Array(buffer)]), filename);
	formData.append("upload_preset", uploadPreset);

	if (folder) {
		formData.append("folder", folder);
	}

	const res = await fetch(
		`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
		{
			method: "POST",
			body: formData,
		},
	);

	if (!res.ok) {
		const error = await res.json();
		console.error("Cloudinary error:", error);
		return new Response(
			JSON.stringify({
				error: error.error?.message || "Cloudinary Upload failed",
			}),
			{ status: 500 },
		);
	}

	return res.json();
}

export function getPublicId(url: string): string {
	const urlParts = url.split("/");
	const filenameWithExt = urlParts[urlParts.length - 1].split(".")[0];
	return filenameWithExt;
}

export async function deleteImage(publicId: string) {
	const res = await cloudinary.uploader.destroy(publicId, {
		resource_type: "image",
		invalidate: true,
	});

	if (res.result !== "ok" && res.result !== "not found") {
		throw new Error("Failed to delete image from Cloudinary");
	}

	return res;
}
