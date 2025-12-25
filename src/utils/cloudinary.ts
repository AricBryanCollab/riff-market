import * as fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

// Configuration
cloudinary.config(env.CLOUDINARY_URL);

interface UploadImageProps {
	filePath: string;
	folder: string;
	deleteLocalFile: boolean;
}

export interface UploadedImage {
	url: string;
	publicId: string;
}

// Utility functions
export async function uploadImage({
	filePath,
	folder = "others",
	deleteLocalFile = true,
}: UploadImageProps): Promise<UploadedImage> {
	try {
		const res = await cloudinary.uploader.upload(filePath, {
			folder: folder || "default",
			resource_type: "auto",
		});

		if (deleteLocalFile) {
			await fs.unlink(filePath);
		}

		const transformedUrl = cloudinary.url(res.public_id, {
			width: 1200,
			height: 1200,
			crop: "fill",
			gravity: "auto",
			quality: "auto",
			fetch_format: "auto",
		});

		return { url: transformedUrl, publicId: res.public_id };
	} catch (err) {
		console.error(err);
		throw new Error("Failed to upload image to Cloudinary");
	}
}

export async function deleteImage(publicId: string) {
	try {
		return await cloudinary.uploader.destroy(publicId, {
			resource_type: "image",
		});
	} catch (err) {
		console.error(err);
		throw new Error("Failed to delete image from Cloudinary");
	}
}

export function getPublicId(url: string): string {
	const urlParts = url.split("/");
	const filenameWithExt = urlParts[urlParts.length - 1].split(".")[0];
	return filenameWithExt;
}
