import type { CleanupImageAssetRef } from "@/types/image-asset";

export type StageListingMediaCleanupCommand = {
	readonly cleanupBatchId: string;
	readonly listingId: string;
	readonly sellerId: string;
	readonly assets: readonly CleanupImageAssetRef[];
};

export type StagedListingMediaCleanupJob = {
	readonly cleanupBatchId: string;
	readonly listingId: string;
	readonly sellerId: string;
	readonly asset: CleanupImageAssetRef;
};

export type StageListingMediaCleanupResult = {
	readonly stagedJobCount: number;
};

export interface ListingMediaCleanupStagingPort {
	stageListingMediaCleanupJobs(
		jobs: readonly StagedListingMediaCleanupJob[],
	): Promise<void>;
}

export async function stageListingMediaForCleanup(
	command: StageListingMediaCleanupCommand,
	staging: ListingMediaCleanupStagingPort,
): Promise<StageListingMediaCleanupResult> {
	const jobs = planListingMediaCleanupJobs(command);

	if (jobs.length > 0) {
		await staging.stageListingMediaCleanupJobs(jobs);
	}

	return { stagedJobCount: jobs.length };
}

export function planListingMediaCleanupJobs(
	command: StageListingMediaCleanupCommand,
): StagedListingMediaCleanupJob[] {
	return dedupeCleanupJobs(
		command.assets.filter(isStageableCleanupAsset).map((asset) => ({
			cleanupBatchId: command.cleanupBatchId,
			listingId: command.listingId,
			sellerId: command.sellerId,
			asset,
		})),
	);
}

function isStageableCleanupAsset(asset: CleanupImageAssetRef) {
	return asset.providerAssetId.trim().length > 0;
}

function getCleanupAssetKey({ asset }: StagedListingMediaCleanupJob) {
	return `${asset.provider}\0${asset.assetType}\0${asset.providerAssetId}`;
}

function dedupeCleanupJobs(jobs: StagedListingMediaCleanupJob[]) {
	const seen = new Set<string>();

	return jobs.filter((job) => {
		const key = getCleanupAssetKey(job);
		if (seen.has(key)) {
			return false;
		}

		seen.add(key);
		return true;
	});
}
