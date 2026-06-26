import {
	MediaCleanupJobSourceType,
	type Prisma,
	type PrismaClient,
} from "generated/prisma/client";
import type {
	ListingMediaCleanupStagingPort,
	StagedListingMediaCleanupJob,
} from "@/domains/media/application/stage-listing-media-cleanup";

type ListingMediaCleanupPrisma = {
	readonly mediaCleanupJob: Pick<PrismaClient["mediaCleanupJob"], "createMany">;
};

export class PrismaListingMediaCleanupStaging
	implements ListingMediaCleanupStagingPort
{
	constructor(private readonly db: ListingMediaCleanupPrisma) {}

	async stageListingMediaCleanupJobs(
		jobs: readonly StagedListingMediaCleanupJob[],
	): Promise<void> {
		if (jobs.length === 0) {
			return;
		}

		await this.db.mediaCleanupJob.createMany({
			data: jobs.map(toPrismaCleanupJobInput),
		});
	}
}

function toPrismaCleanupJobInput(
	job: StagedListingMediaCleanupJob,
): Prisma.MediaCleanupJobCreateManyInput {
	return {
		cleanupBatchId: job.cleanupBatchId,
		provider: job.asset.provider,
		assetType: job.asset.assetType,
		providerAssetId: job.asset.providerAssetId,
		sourceType: MediaCleanupJobSourceType.PRODUCT,
		sourceId: job.listingId,
		sourceUserId: job.sellerId,
	};
}
