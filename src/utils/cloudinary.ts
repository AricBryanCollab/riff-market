import * as fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

// Configuration
let configuration = false;

function initCloudinary() {
	if (configuration) return;
	cloudinary.config({
		cloud_name: env.CLOUDINARY_CLOUD_NAME,
		api_key: env.CLOUDINARY_API_KEY,
		api_secret: env.CLOUDINARY_API_SECRET,
	});

	configuration = true;
}

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
	initCloudinary();

	try {
		const res = await cloudinary.uploader.upload(filePath, {
			folder: folder || "default",
			resource_type: "auto",
			transformation: [
				{
					width: 1200,
					height: 1200,
					crop: "fill",
					gravity: "auto",
					quality: "auto",
					fetch_format: "auto",
				},
			],
		});

		if (deleteLocalFile) {
			await fs.unlink(filePath);
		}

		return { url: res.secure_url, publicId: res.public_id };
	} catch (err) {
		console.error(err);
		throw new Error("Failed to upload image to Cloudinary");
	}
}

export async function deleteImage(publicId: string) {
	initCloudinary();

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
