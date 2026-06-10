import {
	MediaCleanupJobSourceType,
	type Prisma,
} from "generated/prisma/client";
import type { CleanupImageAssetRef } from "@/types/image-asset";
import {
	toCleanupImageAssetRef,
	toCleanupImageAssetRefs,
} from "@/utils/image-asset-ref";

type AccountMediaCleanupSettings = {
	id: string;
	profilePic: Prisma.JsonValue | null;
} | null;

type AccountMediaCleanupProduct = {
	id: string;
	images: Prisma.JsonValue;
};

function hasProviderAssetId(asset: CleanupImageAssetRef) {
	return asset.providerAssetId.trim().length > 0;
}

function toMediaCleanupJobInput({
	cleanupBatchId,
	image,
	sourceType,
	sourceId,
	sourceUserId,
}: {
	cleanupBatchId: string;
	image: CleanupImageAssetRef;
	sourceType: MediaCleanupJobSourceType;
	sourceId: string;
	sourceUserId: string;
}): Prisma.MediaCleanupJobCreateManyInput {
	return {
		cleanupBatchId,
		provider: image.provider,
		assetType: image.assetType,
		providerAssetId: image.providerAssetId,
		sourceType,
		sourceId,
		sourceUserId,
	};
}

function getMediaCleanupJobAssetKey({
	provider,
	assetType,
	providerAssetId,
}: Prisma.MediaCleanupJobCreateManyInput) {
	return `${provider}\0${assetType}\0${providerAssetId}`;
}

function dedupeMediaCleanupJobs(
	jobs: Prisma.MediaCleanupJobCreateManyInput[],
) {
	const seen = new Set<string>();

	return jobs.filter((job) => {
		const key = getMediaCleanupJobAssetKey(job);
		if (seen.has(key)) {
			return false;
		}

		seen.add(key);
		return true;
	});
}

export function getAccountMediaCleanupJobInputs({
	cleanupBatchId,
	userId,
	settings,
	products,
}: {
	cleanupBatchId: string;
	userId: string;
	settings: AccountMediaCleanupSettings;
	products: AccountMediaCleanupProduct[];
}): Prisma.MediaCleanupJobCreateManyInput[] {
	const profileImage = toCleanupImageAssetRef(settings?.profilePic);
	const profileJobs =
		settings && profileImage && hasProviderAssetId(profileImage)
			? [
					toMediaCleanupJobInput({
						cleanupBatchId,
						image: profileImage,
						sourceType: MediaCleanupJobSourceType.USER_PROFILE,
						sourceId: settings.id,
						sourceUserId: userId,
					}),
				]
			: [];

	const productJobs = products.flatMap((product) =>
		toCleanupImageAssetRefs(product.images)
			.filter(hasProviderAssetId)
			.map((image) =>
				toMediaCleanupJobInput({
					cleanupBatchId,
					image,
					sourceType: MediaCleanupJobSourceType.PRODUCT,
					sourceId: product.id,
					sourceUserId: userId,
				}),
			),
	);

	return dedupeMediaCleanupJobs([...profileJobs, ...productJobs]);
}
