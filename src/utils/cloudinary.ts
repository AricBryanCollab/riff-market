import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

cloudinary.config({
	url: env.CLOUDINARY_URL,
});

interface UploadImageProps {
	filePath: string;
	folder: string;
	deleteLocalFile: boolean;
}

export const uploadImage = async ({
	filePath,
	folder = "sites",
	deleteLocalFile = true,
}: UploadImageProps): Promise<string> => {
	try {
		const result = await cloudinary.uploader.upload(filePath, {
			folder: folder || "default",
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
			await fs.unlink(filePath, () => {});
		}

		return result.secure_url;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to upload image to Cloudinary");
	}
};

export const getPublicId = (url: string): string => {
	const urlParts = url.split("/");
	const filenameWithExt = urlParts[urlParts.length - 1].split(".")[0];
	return filenameWithExt;
};

export const deleteImage = async (publicId: string) => {
	try {
		return await cloudinary.uploader.destroy(publicId, {
			resource_type: "image",
		});
	} catch (error) {
		console.error(error);
		throw new Error("Failed to delete image from Cloudinary");
	}
};
