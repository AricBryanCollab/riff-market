import { MediaCleanupJobStatus } from "generated/prisma/client";
import { describe, expect, it } from "vitest";
import {
	type ClaimedMediaCleanupJob,
	type MediaCleanupTarget,
	UnsupportedMediaCleanupTargetError,
} from "@/domains/media/domain/media-cleanup-job";
import {
	type MediaCleanupBatchPorts,
	runMediaCleanupBatchUseCase,
} from "./run-media-cleanup-batch";

const fixedNow = new Date("2026-06-09T10:00:00.000Z");

type StoredCleanupJob = ClaimedMediaCleanupJob & {
	status: keyof typeof MediaCleanupJobStatus;
	runAt: Date;
	lockedUntil: Date | null;
	lockedBy: string | null;
	completedAt: Date | null;
	failedAt: Date | null;
	lastError: string | null;
};

function makeJob(overrides: Partial<StoredCleanupJob> = {}): StoredCleanupJob {
	return {
		id: "job-1",
		provider: "cloudinary",
		assetType: "image",
		providerAssetId: "listings/one",
		attempts: 0,
		maxAttempts: 5,
		status: MediaCleanupJobStatus.PENDING,
		runAt: fixedNow,
		lockedUntil: null,
		lockedBy: null,
		completedAt: null,
		failedAt: null,
		lastError: null,
		...overrides,
	};
}

function toClaimedJob(job: StoredCleanupJob): ClaimedMediaCleanupJob {
	return {
		id: job.id,
		provider: job.provider,
		assetType: job.assetType,
		providerAssetId: job.providerAssetId,
		attempts: job.attempts,
		maxAttempts: job.maxAttempts,
	};
}

function createFakeCleanupPorts({
	jobs,
	deleteError,
	expiredExhaustedJobs = [],
}: {
	jobs: StoredCleanupJob[];
	deleteError?: Error;
	expiredExhaustedJobs?: StoredCleanupJob[];
}) {
	const claimQueue = [...jobs];
	const deletedTargets: string[] = [];
	const events: string[] = [];
	const findOwnedRunningJob = (id: string, workerId: string) =>
		jobs.find(
			(job) =>
				job.id === id &&
				job.status === MediaCleanupJobStatus.RUNNING &&
				job.lockedBy === workerId,
		);

	return {
		deletedTargets,
		events,
		ports: {
			clock: {
				now: () => fixedNow,
			},
			logger: {
				error: () => undefined,
				info: () => undefined,
				warn: () => undefined,
			},
			jobQueue: {
				failExpiredExhausted: async ({
					now,
					lastError,
				}: {
					now: Date;
					lastError: string;
				}) => {
					events.push("failExpiredExhaustedJobs");

					for (const job of expiredExhaustedJobs) {
						job.status = MediaCleanupJobStatus.FAILED;
						job.failedAt = now;
						job.lastError = lastError;
						job.lockedUntil = null;
						job.lockedBy = null;
					}

					return expiredExhaustedJobs.length;
				},
				claimNext: async ({
					workerId,
					lockedUntil,
				}: {
					workerId: string;
					now: Date;
					lockedUntil: Date;
				}) => {
					events.push("claimNextJob");
					const job = claimQueue.shift();

					if (!job) {
						return null;
					}

					job.status = MediaCleanupJobStatus.RUNNING;
					job.attempts += 1;
					job.lockedUntil = lockedUntil;
					job.lockedBy = workerId;
					job.lastError = null;

					return toClaimedJob(job);
				},
				markSucceeded: async ({
					id,
					workerId,
					now,
				}: {
					id: string;
					workerId: string;
					now: Date;
				}) => {
					events.push("markSucceeded");
					const job = findOwnedRunningJob(id, workerId);

					if (!job) {
						return false;
					}

					job.status = MediaCleanupJobStatus.SUCCEEDED;
					job.completedAt = now;
					job.failedAt = null;
					job.lastError = null;
					job.lockedUntil = null;
					job.lockedBy = null;

					return true;
				},
				markForRetry: async ({
					id,
					workerId,
					runAt,
					lastError,
				}: {
					id: string;
					workerId: string;
					now: Date;
					runAt: Date;
					lastError: string;
				}) => {
					events.push("markForRetry");
					const job = findOwnedRunningJob(id, workerId);

					if (!job) {
						return false;
					}

					job.status = MediaCleanupJobStatus.PENDING;
					job.runAt = runAt;
					job.failedAt = null;
					job.lastError = lastError;
					job.lockedUntil = null;
					job.lockedBy = null;

					return true;
				},
				markFailed: async ({
					id,
					workerId,
					now,
					lastError,
				}: {
					id: string;
					workerId: string;
					now: Date;
					lastError: string;
				}) => {
					events.push("markFailed");
					const job = findOwnedRunningJob(id, workerId);

					if (!job) {
						return false;
					}

					job.status = MediaCleanupJobStatus.FAILED;
					job.failedAt = now;
					job.lastError = lastError;
					job.lockedUntil = null;
					job.lockedBy = null;

					return true;
				},
			},
			targetDeletion: {
				deleteTarget: async (
					target: MediaCleanupTarget,
					options: { timeoutMs: number },
				) => {
					events.push("deleteMediaCleanupTarget");

					if (
						target.provider !== "cloudinary" ||
						target.assetType !== "image"
					) {
						throw new UnsupportedMediaCleanupTargetError(target);
					}

					if (deleteError) {
						throw deleteError;
					}

					deletedTargets.push(`${target.providerAssetId}:${options.timeoutMs}`);
				},
			},
		} satisfies MediaCleanupBatchPorts,
	};
}

describe("runMediaCleanupBatchUseCase", () => {
	it("schedules a retry after a temporary target deletion failure", async () => {
		const jobs = [makeJob()];
		const { ports } = createFakeCleanupPorts({
			jobs,
			deleteError: new Error("network down"),
		});

		const summary = await runMediaCleanupBatchUseCase({
			workerId: "worker-1",
			ports,
		});

		expect(jobs[0]).toMatchObject({
			status: MediaCleanupJobStatus.PENDING,
			attempts: 1,
			runAt: new Date("2026-06-09T10:01:00.000Z"),
			lockedUntil: null,
			lockedBy: null,
			lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
		});
		expect(summary).toEqual({
			workerId: "worker-1",
			limit: 50,
			claimed: 1,
			succeeded: 0,
			retried: 1,
			failed: 0,
			expiredFailed: 0,
		});
	});

	it("marks the final failed attempt failed", async () => {
		const jobs = [makeJob({ attempts: 4, maxAttempts: 5 })];
		const { ports } = createFakeCleanupPorts({
			jobs,
			deleteError: new Error("still down"),
		});

		const summary = await runMediaCleanupBatchUseCase({
			workerId: "worker-1",
			ports,
		});

		expect(jobs[0]).toMatchObject({
			status: MediaCleanupJobStatus.FAILED,
			attempts: 5,
			failedAt: fixedNow,
			lockedUntil: null,
			lockedBy: null,
			lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: still down",
		});
		expect(summary).toEqual({
			workerId: "worker-1",
			limit: 50,
			claimed: 1,
			succeeded: 0,
			retried: 0,
			failed: 1,
			expiredFailed: 0,
		});
	});

	it("marks unsupported cleanup targets failed without retrying", async () => {
		const jobs = [
			makeJob({
				provider: "s3",
				assetType: "video",
				providerAssetId: "videos/one",
			}),
		];
		const { ports } = createFakeCleanupPorts({ jobs });

		const summary = await runMediaCleanupBatchUseCase({
			workerId: "worker-1",
			ports,
		});

		expect(jobs[0]).toMatchObject({
			status: MediaCleanupJobStatus.FAILED,
			attempts: 1,
			lockedUntil: null,
			lockedBy: null,
			lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
		});
		expect(summary).toEqual({
			workerId: "worker-1",
			limit: 50,
			claimed: 1,
			succeeded: 0,
			retried: 0,
			failed: 1,
			expiredFailed: 0,
		});
	});

	it("stops after the configured limit even when more jobs are available", async () => {
		const jobs = [
			makeJob({ id: "job-1", providerAssetId: "listings/one" }),
			makeJob({ id: "job-2", providerAssetId: "listings/two" }),
			makeJob({ id: "job-3", providerAssetId: "listings/three" }),
		];
		const { deletedTargets, ports } = createFakeCleanupPorts({ jobs });

		const summary = await runMediaCleanupBatchUseCase({
			workerId: "worker-1",
			limit: 2,
			ports,
		});

		expect(deletedTargets).toEqual([
			"listings/one:30000",
			"listings/two:30000",
		]);
		expect(jobs.map((job) => job.status)).toEqual([
			MediaCleanupJobStatus.SUCCEEDED,
			MediaCleanupJobStatus.SUCCEEDED,
			MediaCleanupJobStatus.PENDING,
		]);
		expect(summary).toEqual({
			workerId: "worker-1",
			limit: 2,
			claimed: 2,
			succeeded: 2,
			retried: 0,
			failed: 0,
			expiredFailed: 0,
		});
	});

	it("fails expired exhausted jobs before claiming new work", async () => {
		const exhaustedJob = makeJob({
			id: "exhausted",
			attempts: 5,
			maxAttempts: 5,
			status: MediaCleanupJobStatus.RUNNING,
			lockedUntil: new Date("2026-06-09T09:59:00.000Z"),
			lockedBy: "dead-worker",
		});
		const pendingJob = makeJob({
			id: "pending",
			providerAssetId: "listings/pending",
		});
		const { ports, events } = createFakeCleanupPorts({
			jobs: [pendingJob],
			expiredExhaustedJobs: [exhaustedJob],
		});

		const summary = await runMediaCleanupBatchUseCase({
			workerId: "worker-1",
			ports,
		});

		expect(events.slice(0, 2)).toEqual([
			"failExpiredExhaustedJobs",
			"claimNextJob",
		]);
		expect(exhaustedJob).toMatchObject({
			status: MediaCleanupJobStatus.FAILED,
			failedAt: fixedNow,
			lockedUntil: null,
			lockedBy: null,
			lastError:
				"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
		});
		expect(pendingJob.status).toBe(MediaCleanupJobStatus.SUCCEEDED);
		expect(summary).toEqual({
			workerId: "worker-1",
			limit: 50,
			claimed: 1,
			succeeded: 1,
			retried: 0,
			failed: 0,
			expiredFailed: 1,
		});
	});
});
