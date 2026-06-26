import { MediaCleanupJobStatus } from "generated/prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { ClaimedMediaCleanupJob } from "@/domains/media/domain/media-cleanup-job";
import { PrismaMediaCleanupJobQueue } from "./prisma-media-cleanup-job-queue";

type QueueDb = ConstructorParameters<typeof PrismaMediaCleanupJobQueue>[0];

const fixedNow = new Date("2026-06-09T10:00:00.000Z");
const lockedUntil = new Date("2026-06-09T10:05:00.000Z");
const maxAttemptsField = { field: "maxAttempts" };

function makeClaimedJob(
	overrides: Partial<ClaimedMediaCleanupJob> = {},
): ClaimedMediaCleanupJob {
	return {
		id: "job-1",
		provider: "cloudinary",
		assetType: "image",
		providerAssetId: "products/one",
		attempts: 1,
		maxAttempts: 5,
		...overrides,
	};
}

function createDb({
	queryRows = [],
	updateCount = 1,
}: {
	queryRows?: ClaimedMediaCleanupJob[];
	updateCount?: number;
} = {}) {
	const queryRaw = vi.fn(() => queryRows);
	const transactionClient = { $queryRaw: queryRaw };
	const updateMany = vi.fn(async () => ({ count: updateCount }));
	const db = {
		$transaction: vi.fn(
			async (
				handler: (
					tx: typeof transactionClient,
				) => Promise<ClaimedMediaCleanupJob[]> | ClaimedMediaCleanupJob[],
			) => handler(transactionClient),
		),
		mediaCleanupJob: {
			updateMany,
			fields: {
				maxAttempts: maxAttemptsField,
			},
		},
	};

	return {
		db: db as unknown as QueueDb,
		queryRaw,
		transaction: db.$transaction,
		updateMany,
	};
}

describe("PrismaMediaCleanupJobQueue", () => {
	it("claims the next eligible cleanup job inside a transaction", async () => {
		const claimedJob = makeClaimedJob();
		const { db, queryRaw, transaction } = createDb({
			queryRows: [claimedJob],
		});

		const result = await new PrismaMediaCleanupJobQueue(db).claimNext({
			workerId: "worker-1",
			now: fixedNow,
			lockedUntil,
		});

		expect(result).toEqual(claimedJob);
		expect(transaction).toHaveBeenCalledTimes(1);
		expect(queryRaw).toHaveBeenCalledTimes(1);

		const firstQueryRawCall = queryRaw.mock.calls[0] as unknown as [
			TemplateStringsArray,
			...unknown[],
		];
		const [strings, ...values] = firstQueryRawCall;
		const sql = strings.join(" ");

		expect(sql).toContain("FOR UPDATE SKIP LOCKED");
		expect(sql).toContain('attempts < "maxAttempts"');
		expect(values).toEqual(
			expect.arrayContaining([
				MediaCleanupJobStatus.PENDING,
				fixedNow,
				MediaCleanupJobStatus.RUNNING,
				fixedNow,
				lockedUntil,
				"worker-1",
			]),
		);
	});

	it("returns null when no cleanup job can be claimed", async () => {
		const { db } = createDb();

		await expect(
			new PrismaMediaCleanupJobQueue(db).claimNext({
				workerId: "worker-1",
				now: fixedNow,
				lockedUntil,
			}),
		).resolves.toBeNull();
	});

	it("marks an owned running cleanup job succeeded", async () => {
		const { db, updateMany } = createDb();

		await expect(
			new PrismaMediaCleanupJobQueue(db).markSucceeded({
				id: "job-1",
				workerId: "worker-1",
				now: fixedNow,
			}),
		).resolves.toBe(true);

		expect(updateMany).toHaveBeenCalledWith({
			where: {
				id: "job-1",
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: "worker-1",
			},
			data: {
				status: MediaCleanupJobStatus.SUCCEEDED,
				completedAt: fixedNow,
				failedAt: null,
				lastError: null,
				lockedUntil: null,
				lockedBy: null,
			},
		});
	});

	it("reports skipped status transitions", async () => {
		const { db } = createDb({ updateCount: 0 });

		await expect(
			new PrismaMediaCleanupJobQueue(db).markSucceeded({
				id: "job-1",
				workerId: "worker-1",
				now: fixedNow,
			}),
		).resolves.toBe(false);
	});

	it("reschedules an owned running cleanup job for retry", async () => {
		const { db, updateMany } = createDb();
		const runAt = new Date("2026-06-09T10:01:00.000Z");

		await expect(
			new PrismaMediaCleanupJobQueue(db).markForRetry({
				id: "job-1",
				workerId: "worker-1",
				now: fixedNow,
				runAt,
				lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
			}),
		).resolves.toBe(true);

		expect(updateMany).toHaveBeenCalledWith({
			where: {
				id: "job-1",
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: "worker-1",
			},
			data: {
				status: MediaCleanupJobStatus.PENDING,
				runAt,
				failedAt: null,
				lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
				lockedUntil: null,
				lockedBy: null,
				updatedAt: fixedNow,
			},
		});
	});

	it("marks an owned running cleanup job failed", async () => {
		const { db, updateMany } = createDb();

		await expect(
			new PrismaMediaCleanupJobQueue(db).markFailed({
				id: "job-1",
				workerId: "worker-1",
				now: fixedNow,
				lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
			}),
		).resolves.toBe(true);

		expect(updateMany).toHaveBeenCalledWith({
			where: {
				id: "job-1",
				status: MediaCleanupJobStatus.RUNNING,
				lockedBy: "worker-1",
			},
			data: {
				status: MediaCleanupJobStatus.FAILED,
				failedAt: fixedNow,
				lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
				lockedUntil: null,
				lockedBy: null,
			},
		});
	});

	it("fails expired exhausted cleanup jobs", async () => {
		const { db, updateMany } = createDb({ updateCount: 2 });

		await expect(
			new PrismaMediaCleanupJobQueue(db).failExpiredExhausted({
				now: fixedNow,
				lastError:
					"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
			}),
		).resolves.toBe(2);

		expect(updateMany).toHaveBeenCalledWith({
			where: {
				attempts: {
					gte: maxAttemptsField,
				},
				OR: [
					{
						status: MediaCleanupJobStatus.PENDING,
						runAt: {
							lte: fixedNow,
						},
					},
					{
						status: MediaCleanupJobStatus.RUNNING,
						lockedUntil: {
							lte: fixedNow,
						},
					},
				],
			},
			data: {
				status: MediaCleanupJobStatus.FAILED,
				failedAt: fixedNow,
				lastError:
					"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
				lockedUntil: null,
				lockedBy: null,
			},
		});
	});
});
