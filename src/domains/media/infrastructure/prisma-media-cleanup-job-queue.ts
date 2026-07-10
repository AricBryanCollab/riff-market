import type { PrismaClient } from "generated/prisma/client";
import { MediaCleanupJobStatus } from "generated/prisma/client";
import type { MediaCleanupJobQueuePort } from "@/domains/media/application/run-media-cleanup-batch";
import type { ClaimedMediaCleanupJob } from "@/domains/media/domain/media-cleanup-job";

type PrismaMediaCleanupJobQueueClient = Pick<
	PrismaClient,
	"$transaction" | "mediaCleanupJob"
>;

export class PrismaMediaCleanupJobQueue implements MediaCleanupJobQueuePort {
	constructor(private readonly db: PrismaMediaCleanupJobQueueClient) {}

	async claimNext({
		workerId,
		now,
		lockedUntil,
	}: {
		workerId: string;
		now: Date;
		lockedUntil: Date;
	}): Promise<ClaimedMediaCleanupJob | null> {
		const jobs = await this.db.$transaction(
			(tx) =>
				tx.$queryRaw<ClaimedMediaCleanupJob[]>`
				WITH next_job AS (
					SELECT id
					FROM "MediaCleanupJob"
					WHERE (
						(status = ${MediaCleanupJobStatus.PENDING}::"MediaCleanupJobStatus" AND "runAt" <= ${now})
						OR (status = ${MediaCleanupJobStatus.RUNNING}::"MediaCleanupJobStatus" AND "lockedUntil" <= ${now})
					)
					AND attempts < "maxAttempts"
					ORDER BY "runAt" ASC, "createdAt" ASC, id ASC
					FOR UPDATE SKIP LOCKED
					LIMIT 1
				)
				UPDATE "MediaCleanupJob" AS job
				SET
					status = ${MediaCleanupJobStatus.RUNNING}::"MediaCleanupJobStatus",
					attempts = job.attempts + 1,
					"lockedUntil" = ${lockedUntil},
					"lockedBy" = ${workerId},
					"lastError" = NULL,
					"updatedAt" = ${now}
				FROM next_job
				WHERE job.id = next_job.id
				RETURNING
					job.id,
					job.provider,
					job."assetType",
					job."providerAssetId",
					job.attempts,
					job."maxAttempts"
			`,
		);

		return jobs[0] ?? null;
	}

	async markSucceeded({
		id,
		workerId,
		now,
	}: {
		id: string;
		workerId: string;
		now: Date;
	}): Promise<boolean> {
		const result = await this.db.mediaCleanupJob.updateMany({
			where: {
				id,
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: workerId,
			},
			data: {
				status: MediaCleanupJobStatus.SUCCEEDED,
				completedAt: now,
				failedAt: null,
				lastError: null,
				lockedUntil: null,
				lockedBy: null,
			},
		});

		return result.count === 1;
	}

	async markForRetry({
		id,
		workerId,
		now,
		lastError,
		runAt,
	}: {
		id: string;
		workerId: string;
		now: Date;
		runAt: Date;
		lastError: string;
	}): Promise<boolean> {
		const result = await this.db.mediaCleanupJob.updateMany({
			where: {
				id,
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: workerId,
			},
			data: {
				status: MediaCleanupJobStatus.PENDING,
				runAt,
				failedAt: null,
				lastError,
				lockedUntil: null,
				lockedBy: null,
				updatedAt: now,
			},
		});

		return result.count === 1;
	}

	async markFailed({
		id,
		workerId,
		now,
		lastError,
	}: {
		id: string;
		workerId: string;
		now: Date;
		lastError: string;
	}): Promise<boolean> {
		const result = await this.db.mediaCleanupJob.updateMany({
			where: {
				id,
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: workerId,
			},
			data: {
				status: MediaCleanupJobStatus.FAILED,
				failedAt: now,
				lastError,
				lockedUntil: null,
				lockedBy: null,
			},
		});

		return result.count === 1;
	}

	async failExpiredExhausted({
		now,
		lastError,
	}: {
		now: Date;
		lastError: string;
	}): Promise<number> {
		const result = await this.db.mediaCleanupJob.updateMany({
			where: {
				attempts: {
					gte: this.db.mediaCleanupJob.fields.maxAttempts,
				},
				OR: [
					{
						status: MediaCleanupJobStatus.PENDING,
						runAt: {
							lte: now,
						},
					},
					{
						status: MediaCleanupJobStatus.RUNNING,
						lockedUntil: {
							lte: now,
						},
					},
				],
			},
			data: {
				status: MediaCleanupJobStatus.FAILED,
				failedAt: now,
				lastError,
				lockedUntil: null,
				lockedBy: null,
			},
		});

		return result.count;
	}
}
