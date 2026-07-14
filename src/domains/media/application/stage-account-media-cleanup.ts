import type { CleanupImageAssetRef } from "@/domains/shared/domain/image-asset";

export type AccountMediaInventory = {
	readonly profile: AccountProfileMedia | null;
	readonly listings: readonly AccountListingMedia[];
};

export type AccountProfileMedia = {
	readonly settingsId: string;
	readonly profilePic: CleanupImageAssetRef | null;
};

export type AccountListingMedia = {
	readonly listingId: string;
	readonly images: readonly CleanupImageAssetRef[];
};

export type AccountMediaCleanupSource =
	| {
			readonly kind: "profile";
			readonly id: string;
	  }
	| {
			readonly kind: "listing";
			readonly id: string;
	  };

export type StagedAccountMediaCleanupJob = {
	readonly cleanupBatchId: string;
	readonly accountId: string;
	readonly source: AccountMediaCleanupSource;
	readonly asset: CleanupImageAssetRef;
};

export type StageAccountMediaCleanupCommand = {
	readonly accountId: string;
	readonly cleanupBatchId: string;
};

export type StageAccountMediaCleanupResult = {
	readonly stagedJobCount: number;
};

export interface AccountMediaCleanupStagingPort {
	loadAccountMediaInventory(accountId: string): Promise<AccountMediaInventory>;
	stageAccountMediaCleanupJobs(
		jobs: readonly StagedAccountMediaCleanupJob[],
	): Promise<void>;
}

export async function stageAccountMediaForCleanup(
	command: StageAccountMediaCleanupCommand,
	staging: AccountMediaCleanupStagingPort,
): Promise<StageAccountMediaCleanupResult> {
	const inventory = await staging.loadAccountMediaInventory(command.accountId);
	const jobs = planAccountMediaCleanupJobs(command, inventory);

	if (jobs.length > 0) {
		await staging.stageAccountMediaCleanupJobs(jobs);
	}

	return { stagedJobCount: jobs.length };
}

export function planAccountMediaCleanupJobs(
	command: StageAccountMediaCleanupCommand,
	inventory: AccountMediaInventory,
): StagedAccountMediaCleanupJob[] {
	const profileJobs =
		inventory.profile?.profilePic &&
		isStageableCleanupAsset(inventory.profile.profilePic)
			? [
					toCleanupJob(command, inventory.profile.profilePic, {
						kind: "profile",
						id: inventory.profile.settingsId,
					}),
				]
			: [];

	const listingJobs = inventory.listings.flatMap((listing) =>
		listing.images.filter(isStageableCleanupAsset).map((image) =>
			toCleanupJob(command, image, {
				kind: "listing",
				id: listing.listingId,
			}),
		),
	);

	return dedupeCleanupJobs([...profileJobs, ...listingJobs]);
}

function toCleanupJob(
	command: StageAccountMediaCleanupCommand,
	asset: CleanupImageAssetRef,
	source: AccountMediaCleanupSource,
): StagedAccountMediaCleanupJob {
	return {
		cleanupBatchId: command.cleanupBatchId,
		accountId: command.accountId,
		source,
		asset,
	};
}

function isStageableCleanupAsset(asset: CleanupImageAssetRef) {
	return asset.providerAssetId.trim().length > 0;
}

function getCleanupAssetKey({ asset }: StagedAccountMediaCleanupJob) {
	return `${asset.provider}\0${asset.assetType}\0${asset.providerAssetId}`;
}

function dedupeCleanupJobs(jobs: StagedAccountMediaCleanupJob[]) {
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
