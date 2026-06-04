import type { ImageAssetRef, ImageAssetSource } from "@/types/image-asset";

export type CloudinaryImageRef = ImageAssetRef;
export type CloudinaryImageSource = ImageAssetSource;

export interface CloudinaryUploadResult {
	secure_url?: string;
	public_id?: string;
	error?: string;
}
