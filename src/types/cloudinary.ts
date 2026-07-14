import type { ImageAssetRef } from "@/domains/shared/domain/image-asset";

export type CloudinaryImageRef = ImageAssetRef;

export interface CloudinaryUploadResult {
	secure_url?: string;
	public_id?: string;
	error?: string;
}
