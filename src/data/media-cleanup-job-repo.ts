import type { PrismaClient } from "generated/prisma/client";
import { MediaCleanupJobStatus } from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import type { ClaimedMediaCleanupJob } from "@/domains/media/domain/media-cleanup-job";

type TransactionCapableDbClient = Pick<PrismaClient, "$transaction">;

export type { ClaimedMediaCleanupJob };

type ClaimNextMediaCleanupJobOptions = {
	workerId: string;
	now: Date;
	lockedUntil: Date;
	db?: TransactionCapableDbClient;
};

type MarkMediaCleanupJobOptions = {
	id: string;
	workerId: string;
	now: Date;
};

type MarkMediaCleanupJobFailureOptions = MarkMediaCleanupJobOptions & {
	lastError: string;
};

export async function claimNextMediaCleanupJob({
	workerId,
	now,
	lockedUntil,
	db = prisma,
}: ClaimNextMediaCleanupJobOptions): Promise<ClaimedMediaCleanupJob | null> {
	const jobs = await db.$transaction(
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

export async function markMediaCleanupJobSucceeded({
	id,
	workerId,
	now,
}: MarkMediaCleanupJobOptions): Promise<boolean> {
	const result = await prisma.mediaCleanupJob.updateMany({
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

export async function markMediaCleanupJobForRetry({
	id,
	workerId,
	now,
	lastError,
	runAt,
}: MarkMediaCleanupJobFailureOptions & {
	runAt: Date;
}): Promise<boolean> {
	const result = await prisma.mediaCleanupJob.updateMany({
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

export async function markMediaCleanupJobFailed({
	id,
	workerId,
	now,
	lastError,
}: MarkMediaCleanupJobFailureOptions): Promise<boolean> {
	const result = await prisma.mediaCleanupJob.updateMany({
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

export async function markExpiredExhaustedMediaCleanupJobsFailed({
	now,
	lastError,
}: {
	now: Date;
	lastError: string;
}): Promise<number> {
	const result = await prisma.mediaCleanupJob.updateMany({
		where: {
			attempts: {
				gte: prisma.mediaCleanupJob.fields.maxAttempts,
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
