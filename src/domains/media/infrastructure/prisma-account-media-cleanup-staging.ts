import {
	MediaCleanupJobSourceType,
	type Prisma,
	type PrismaClient,
} from "generated/prisma/client";
import type {
	AccountMediaCleanupStagingPort,
	AccountMediaInventory,
	StagedAccountMediaCleanupJob,
} from "@/domains/media/application/stage-account-media-cleanup";
import {
	toCleanupImageAssetRef,
	toCleanupImageAssetRefs,
} from "@/utils/image-asset-ref";

type AccountMediaCleanupPrisma = {
	readonly mediaCleanupJob: Pick<PrismaClient["mediaCleanupJob"], "createMany">;
	readonly product: Pick<PrismaClient["product"], "findMany">;
	readonly userSettings: Pick<PrismaClient["userSettings"], "findUnique">;
};

export class PrismaAccountMediaCleanupStaging
	implements AccountMediaCleanupStagingPort
{
	constructor(private readonly db: AccountMediaCleanupPrisma) {}

	async loadAccountMediaInventory(
		accountId: string,
	): Promise<AccountMediaInventory> {
		const [settings, products] = await Promise.all([
			this.db.userSettings.findUnique({
				where: { userId: accountId },
				select: {
					id: true,
					profilePic: true,
				},
			}),
			this.db.product.findMany({
				where: { sellerId: accountId },
				select: {
					id: true,
					images: true,
				},
			}),
		]);

		return {
			profile: settings
				? {
						settingsId: settings.id,
						profilePic: toCleanupImageAssetRef(settings.profilePic),
					}
				: null,
			products: products.map((product) => ({
				productId: product.id,
				images: toCleanupImageAssetRefs(product.images),
			})),
		};
	}

	async stageAccountMediaCleanupJobs(
		jobs: readonly StagedAccountMediaCleanupJob[],
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
	job: StagedAccountMediaCleanupJob,
): Prisma.MediaCleanupJobCreateManyInput {
	return {
		cleanupBatchId: job.cleanupBatchId,
		provider: job.asset.provider,
		assetType: job.asset.assetType,
		providerAssetId: job.asset.providerAssetId,
		sourceType: toPrismaSourceType(job.source.kind),
		sourceId: job.source.id,
		sourceUserId: job.accountId,
	};
}

function toPrismaSourceType(
	sourceKind: StagedAccountMediaCleanupJob["source"]["kind"],
) {
	switch (sourceKind) {
		case "profile":
			return MediaCleanupJobSourceType.USER_PROFILE;
		case "product":
			return MediaCleanupJobSourceType.PRODUCT;
	}
}
