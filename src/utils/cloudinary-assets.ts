import type { CloudinaryImageRef } from "@/types/cloudinary";
import { deleteImage } from "@/utils/cloudinary";

export async function deleteCloudinaryImageAsset(image: CloudinaryImageRef) {
	return deleteImage(image.publicId);
}

export async function deleteCloudinaryImageAssets(
	images: CloudinaryImageRef[],
) {
	return Promise.all(images.map(deleteCloudinaryImageAsset));
}

export async function tryDeleteCloudinaryImageAssets(
	images: CloudinaryImageRef[],
) {
	return Promise.allSettled(images.map(deleteCloudinaryImageAsset));
}
