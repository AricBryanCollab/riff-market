import {
	type MediaCleanupTarget,
	UnsupportedMediaCleanupTargetError,
} from "@/domains/media/domain/media-cleanup-job";
import { deleteImage } from "@/utils/cloudinary";

export async function deleteMediaCleanupTarget(
	target: MediaCleanupTarget,
	options: { timeoutMs: number },
) {
	if (target.provider === "cloudinary" && target.assetType === "image") {
		return deleteImage(target.providerAssetId, options);
	}

	throw new UnsupportedMediaCleanupTargetError(target);
}
