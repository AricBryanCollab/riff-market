import type { AccountProfilePictureAsset } from "@/domains/accounts/dto/account-profile-picture";
import { env } from "@/env";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { unsignedUploadImage } from "@/utils/cloudinary";
import { deleteCloudinaryImageAsset } from "@/utils/cloudinary-assets";
import { compressImage } from "@/utils/compress-image";

function getMissingUploadMetadataMessage(
	uploadResult: CloudinaryUploadResult | null | undefined,
) {
	const missingFields = [];

	if (!uploadResult?.secure_url) {
		missingFields.push("secure URL");
	}

	if (!uploadResult?.public_id) {
		missingFields.push("public ID");
	}

	return `Image upload did not return required ${missingFields.join(" and ")}`;
}

export class CloudinaryProfilePictureAssets {
	async uploadProfilePicture(
		profilePic: File,
	): Promise<AccountProfilePictureAsset> {
		const compressedImage = await compressImage({
			file: profilePic,
			options: {
				maxSize: 800,
				quality: 85,
				format: "jpeg",
			},
		});

		const uploadResult = (await unsignedUploadImage({
			buffer: compressedImage.buffer,
			filename: profilePic.name,
			uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
		})) as CloudinaryUploadResult;

		if (!uploadResult?.secure_url || !uploadResult.public_id) {
			throw new Error(
				uploadResult?.error ?? getMissingUploadMetadataMessage(uploadResult),
			);
		}

		return {
			url: uploadResult.secure_url,
			publicId: uploadResult.public_id,
		};
	}

	async deleteProfilePictureAsset(
		profilePic: AccountProfilePictureAsset,
	): Promise<void> {
		await deleteCloudinaryImageAsset(profilePic);
	}
}
