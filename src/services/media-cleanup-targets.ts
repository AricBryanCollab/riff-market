import type { ClaimedMediaCleanupJob } from "@/data/media-cleanup-job-repo";
import { deleteImage } from "@/utils/cloudinary";

export type MediaCleanupTarget = Pick<
	ClaimedMediaCleanupJob,
	"provider" | "assetType" | "providerAssetId"
>;

export class UnsupportedMediaCleanupTargetError extends Error {
	constructor(target: MediaCleanupTarget) {
		super(`${target.provider}/${target.assetType}`);
		this.name = "UnsupportedMediaCleanupTargetError";
	}
}

export async function deleteMediaCleanupTarget(
	target: MediaCleanupTarget,
	options: { timeoutMs: number },
) {
	if (target.provider === "cloudinary" && target.assetType === "image") {
		return deleteImage(target.providerAssetId, options);
	}

	throw new UnsupportedMediaCleanupTargetError(target);
}
