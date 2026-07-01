import type { PrismaClient } from "generated/prisma/client";
import {
	MediaCleanupJobSourceType,
	MediaCleanupJobStatus,
} from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import {
	describeDb,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";
import { PrismaMediaCleanupJobQueue } from "./prisma-media-cleanup-job-queue";

const fixedNow = new Date("2026-06-09T10:00:00.000Z");
const lockedUntil = new Date("2026-06-09T10:05:00.000Z");
const retryRunAt = new Date("2026-06-09T10:01:00.000Z");
const attemptsExhaustedError =
	"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed";

describeDb("PrismaMediaCleanupJobQueue database behavior", () => {
	let db: PrismaClient;
	let queue: PrismaMediaCleanupJobQueue;
	const testDb = setupPrismaTestDatabase();

	beforeEach(() => {
		db = testDb.client;
		queue = new PrismaMediaCleanupJobQueue(db);
	});

	it("claims an eligible cleanup job and locks it for the worker", async () => {
		await seedCleanupJob(db, {
			id: "ready-job",
			lastError: "previous failure",
		});

		const claimed = await queue.claimNext({
			workerId: "worker-1",
			now: fixedNow,
			lockedUntil,
		});

		expect(claimed).toEqual({
			id: "ready-job",
			provider: "cloudinary",
			assetType: "image",
			providerAssetId: "listings/ready-job",
			attempts: 1,
			maxAttempts: 5,
		});
		await expectCleanupJobState(db, "ready-job", {
			status: MediaCleanupJobStatus.RUNNING,
			attempts: 1,
			lockedBy: "worker-1",
			lockedUntil,
			lastError: null,
		});
	});

	it("claims the oldest eligible cleanup job first", async () => {
		await seedCleanupJob(db, {
			id: "older-ready-job",
			runAt: new Date("2026-06-09T09:59:00.000Z"),
			createdAt: new Date("2026-06-09T09:50:00.000Z"),
		});
		await seedCleanupJob(db, {
			id: "newer-ready-job",
			runAt: new Date("2026-06-09T09:59:00.000Z"),
			createdAt: new Date("2026-06-09T09:51:00.000Z"),
		});

		const claimed = await queue.claimNext({
			workerId: "worker-1",
			now: fixedNow,
			lockedUntil,
		});

		expect(claimed?.id).toBe("older-ready-job");
		await expectCleanupJobState(db, "newer-ready-job", {
			status: MediaCleanupJobStatus.PENDING,
			attempts: 0,
		});
	});

	it("skips future and exhausted cleanup jobs", async () => {
		await seedCleanupJob(db, {
			id: "future-job",
			runAt: new Date("2026-06-09T10:01:00.000Z"),
		});
		await seedCleanupJob(db, {
			id: "exhausted-job",
			attempts: 5,
			maxAttempts: 5,
			runAt: new Date("2026-06-09T09:58:00.000Z"),
		});

		await expect(
			queue.claimNext({
				workerId: "worker-1",
				now: fixedNow,
				lockedUntil,
			}),
		).resolves.toBeNull();

		await expectCleanupJobState(db, "future-job", {
			status: MediaCleanupJobStatus.PENDING,
			attempts: 0,
		});
		await expectCleanupJobState(db, "exhausted-job", {
			status: MediaCleanupJobStatus.PENDING,
			attempts: 5,
		});
	});

	it("reclaims expired running cleanup jobs", async () => {
		await seedCleanupJob(db, {
			id: "expired-running-job",
			status: MediaCleanupJobStatus.RUNNING,
			attempts: 2,
			lockedBy: "previous-worker",
			lockedUntil: new Date("2026-06-09T09:59:59.000Z"),
			lastError: "worker timed out",
		});

		const claimed = await queue.claimNext({
			workerId: "worker-2",
			now: fixedNow,
			lockedUntil,
		});

		expect(claimed).toMatchObject({
			id: "expired-running-job",
			attempts: 3,
		});
		await expectCleanupJobState(db, "expired-running-job", {
			status: MediaCleanupJobStatus.RUNNING,
			attempts: 3,
			lockedBy: "worker-2",
			lockedUntil,
			lastError: null,
		});
	});

	it("marks an owned running cleanup job succeeded", async () => {
		await seedRunningCleanupJob(db, "succeeded-job");

		await expect(
			queue.markSucceeded({
				id: "succeeded-job",
				workerId: "worker-1",
				now: fixedNow,
			}),
		).resolves.toBe(true);

		await expectCleanupJobState(db, "succeeded-job", {
			status: MediaCleanupJobStatus.SUCCEEDED,
			completedAt: fixedNow,
			failedAt: null,
			lastError: null,
			lockedUntil: null,
			lockedBy: null,
		});
	});

	it("reschedules an owned running cleanup job for retry", async () => {
		await seedRunningCleanupJob(db, "retry-job");

		await expect(
			queue.markForRetry({
				id: "retry-job",
				workerId: "worker-1",
				now: fixedNow,
				runAt: retryRunAt,
				lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
			}),
		).resolves.toBe(true);

		await expectCleanupJobState(db, "retry-job", {
			status: MediaCleanupJobStatus.PENDING,
			runAt: retryRunAt,
			failedAt: null,
			lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
			lockedUntil: null,
			lockedBy: null,
		});
	});

	it("marks an owned running cleanup job failed", async () => {
		await seedRunningCleanupJob(db, "failed-job", { attempts: 5 });

		await expect(
			queue.markFailed({
				id: "failed-job",
				workerId: "worker-1",
				now: fixedNow,
				lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
			}),
		).resolves.toBe(true);

		await expectCleanupJobState(db, "failed-job", {
			status: MediaCleanupJobStatus.FAILED,
			failedAt: fixedNow,
			lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
			lockedUntil: null,
			lockedBy: null,
		});
	});

	it("rejects status changes from a worker that does not own the job", async () => {
		await seedRunningCleanupJob(db, "other-worker-job", {
			lockedBy: "worker-2",
		});

		await expect(
			queue.markSucceeded({
				id: "other-worker-job",
				workerId: "worker-1",
				now: fixedNow,
			}),
		).resolves.toBe(false);

		await expectCleanupJobState(db, "other-worker-job", {
			status: MediaCleanupJobStatus.RUNNING,
			lockedBy: "worker-2",
		});
	});

	it("fails exhausted cleanup jobs that are due or expired", async () => {
		await seedCleanupJob(db, {
			id: "pending-exhausted-job",
			attempts: 5,
			maxAttempts: 5,
			runAt: new Date("2026-06-09T09:59:00.000Z"),
		});
		await seedCleanupJob(db, {
			id: "running-exhausted-job",
			status: MediaCleanupJobStatus.RUNNING,
			attempts: 5,
			maxAttempts: 5,
			lockedBy: "worker-1",
			lockedUntil: new Date("2026-06-09T09:59:59.000Z"),
		});

		await expect(
			queue.failExpiredExhausted({
				now: fixedNow,
				lastError: attemptsExhaustedError,
			}),
		).resolves.toBe(2);

		await expectCleanupJobState(db, "pending-exhausted-job", {
			status: MediaCleanupJobStatus.FAILED,
			failedAt: fixedNow,
			lastError: attemptsExhaustedError,
			lockedUntil: null,
			lockedBy: null,
		});
		await expectCleanupJobState(db, "running-exhausted-job", {
			status: MediaCleanupJobStatus.FAILED,
			failedAt: fixedNow,
			lockedUntil: null,
			lockedBy: null,
		});
	});

	it("leaves non-exhausted and future cleanup jobs untouched", async () => {
		await seedCleanupJob(db, {
			id: "future-exhausted-job",
			attempts: 5,
			maxAttempts: 5,
			runAt: new Date("2026-06-09T10:01:00.000Z"),
		});
		await seedCleanupJob(db, {
			id: "retryable-job",
			attempts: 1,
			maxAttempts: 5,
			runAt: new Date("2026-06-09T09:59:00.000Z"),
		});

		await expect(
			queue.failExpiredExhausted({
				now: fixedNow,
				lastError: attemptsExhaustedError,
			}),
		).resolves.toBe(0);

		await expectCleanupJobState(db, "future-exhausted-job", {
			status: MediaCleanupJobStatus.PENDING,
			failedAt: null,
		});
		await expectCleanupJobState(db, "retryable-job", {
			status: MediaCleanupJobStatus.PENDING,
			failedAt: null,
		});
	});
});

async function expectCleanupJobState(
	db: PrismaClient,
	id: string,
	expected: Record<string, unknown>,
) {
	await expect(
		db.mediaCleanupJob.findUniqueOrThrow({ where: { id } }),
	).resolves.toMatchObject(expected);
}

async function seedRunningCleanupJob(
	db: PrismaClient,
	id: string,
	overrides: Partial<CleanupJobSeed> = {},
) {
	await seedCleanupJob(db, {
		id,
		status: MediaCleanupJobStatus.RUNNING,
		attempts: 1,
		lockedBy: "worker-1",
		lockedUntil,
		...overrides,
	});
}

type CleanupJobSeed = {
	readonly id: string;
	readonly status?: MediaCleanupJobStatus;
	readonly attempts?: number;
	readonly maxAttempts?: number;
	readonly runAt?: Date;
	readonly lockedUntil?: Date | null;
	readonly lockedBy?: string | null;
	readonly lastError?: string | null;
	readonly createdAt?: Date;
};

async function seedCleanupJob(db: PrismaClient, seed: CleanupJobSeed) {
	await db.mediaCleanupJob.create({
		data: {
			id: seed.id,
			cleanupBatchId: `batch-${seed.id}`,
			provider: "cloudinary",
			assetType: "image",
			providerAssetId: `listings/${seed.id}`,
			sourceType: MediaCleanupJobSourceType.LISTING,
			sourceId: `listing-${seed.id}`,
			sourceUserId: "seller-1",
			status: seed.status ?? MediaCleanupJobStatus.PENDING,
			attempts: seed.attempts ?? 0,
			maxAttempts: seed.maxAttempts ?? 5,
			runAt: seed.runAt ?? fixedNow,
			lockedUntil: seed.lockedUntil ?? null,
			lockedBy: seed.lockedBy ?? null,
			lastError: seed.lastError ?? null,
			...(seed.createdAt && { createdAt: seed.createdAt }),
		},
	});
}
