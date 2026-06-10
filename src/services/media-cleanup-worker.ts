import { randomUUID } from "node:crypto";
import {
	type ClaimedMediaCleanupJob,
	claimNextMediaCleanupJob,
	markExpiredExhaustedMediaCleanupJobsFailed,
	markMediaCleanupJobFailed,
	markMediaCleanupJobForRetry,
	markMediaCleanupJobSucceeded,
} from "@/data/media-cleanup-job-repo";
import { logger } from "@/lib/logger";
import {
	deleteMediaCleanupTarget,
	UnsupportedMediaCleanupTargetError,
} from "./media-cleanup-targets";

export const DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT = 50;
const DEFAULT_MEDIA_CLEANUP_LOCK_MS = 5 * 60 * 1000;
const DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS = 30 * 1000;
const LAST_ERROR_MAX_LENGTH = 500;
const RETRY_DELAYS_MS = [
	60 * 1000,
	5 * 60 * 1000,
	15 * 60 * 1000,
	60 * 60 * 1000,
] as const;

type MediaCleanupLogger = Pick<typeof logger, "error" | "info" | "warn">;

type MediaCleanupWorkerDeps = {
	claimNextJob: typeof claimNextMediaCleanupJob;
	deleteMediaCleanupTarget: typeof deleteMediaCleanupTarget;
	failExpiredExhaustedJobs: typeof markExpiredExhaustedMediaCleanupJobsFailed;
	markFailed: typeof markMediaCleanupJobFailed;
	markForRetry: typeof markMediaCleanupJobForRetry;
	markSucceeded: typeof markMediaCleanupJobSucceeded;
	logger: MediaCleanupLogger;
	now: () => Date;
};

export type MediaCleanupBatchSummary = {
	workerId: string;
	limit: number;
	claimed: number;
	succeeded: number;
	retried: number;
	failed: number;
	expiredFailed: number;
};

export type RunMediaCleanupBatchOptions = {
	limit?: number;
	workerId?: string;
	lockMs?: number;
	deleteTimeoutMs?: number;
	deps?: Partial<MediaCleanupWorkerDeps>;
};

const defaultDeps: MediaCleanupWorkerDeps = {
	claimNextJob: claimNextMediaCleanupJob,
	deleteMediaCleanupTarget,
	failExpiredExhaustedJobs: markExpiredExhaustedMediaCleanupJobsFailed,
	markFailed: markMediaCleanupJobFailed,
	markForRetry: markMediaCleanupJobForRetry,
	markSucceeded: markMediaCleanupJobSucceeded,
	logger,
	now: () => new Date(),
};

function getDeps(overrides?: Partial<MediaCleanupWorkerDeps>) {
	return {
		...defaultDeps,
		...(overrides ?? {}),
	};
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
	if (value === undefined) {
		return fallback;
	}

	if (!Number.isInteger(value) || value < 1) {
		throw new Error("Media cleanup limit must be a positive integer");
	}

	return value;
}

export function createMediaCleanupWorkerId() {
	return `media-cleanup-${new Date().toISOString()}-${randomUUID().slice(0, 8)}`;
}

function getRetryDelayMs(attempts: number) {
	const index = Math.max(0, attempts - 1);
	return RETRY_DELAYS_MS[Math.min(index, RETRY_DELAYS_MS.length - 1)];
}

function getRetryRunAt(now: Date, attempts: number) {
	return new Date(now.getTime() + getRetryDelayMs(attempts));
}

export function formatMediaCleanupJobError(
	category: string,
	error: unknown,
): string {
	const message = error instanceof Error ? error.message : String(error);
	const lastError = `${category}: ${message}`;

	return lastError.length > LAST_ERROR_MAX_LENGTH
		? lastError.slice(0, LAST_ERROR_MAX_LENGTH)
		: lastError;
}

async function markJobFailed(
	job: ClaimedMediaCleanupJob,
	workerId: string,
	now: Date,
	lastError: string,
	deps: MediaCleanupWorkerDeps,
) {
	const marked = await deps.markFailed({
		id: job.id,
		workerId,
		now,
		lastError,
	});

	if (!marked) {
		deps.logger.warn("media_cleanup_job_mark_failed_skipped", {
			jobId: job.id,
			workerId,
		});
	}

	return marked;
}

async function processClaimedMediaCleanupJob({
	job,
	workerId,
	deleteTimeoutMs,
	deps,
	summary,
}: {
	job: ClaimedMediaCleanupJob;
	workerId: string;
	deleteTimeoutMs: number;
	deps: MediaCleanupWorkerDeps;
	summary: MediaCleanupBatchSummary;
}) {
	try {
		await deps.deleteMediaCleanupTarget(job, {
			timeoutMs: deleteTimeoutMs,
		});

		const marked = await deps.markSucceeded({
			id: job.id,
			workerId,
			now: deps.now(),
		});

		if (marked) {
			summary.succeeded += 1;
		} else {
			deps.logger.warn("media_cleanup_job_mark_succeeded_skipped", {
				jobId: job.id,
				workerId,
			});
		}
	} catch (error) {
		if (error instanceof UnsupportedMediaCleanupTargetError) {
			const lastError = formatMediaCleanupJobError(
				"UNSUPPORTED_MEDIA_CLEANUP_TARGET",
				error,
			);
			const marked = await markJobFailed(
				job,
				workerId,
				deps.now(),
				lastError,
				deps,
			);

			if (marked) {
				summary.failed += 1;
				deps.logger.error("media_cleanup_job_failed", error, {
					jobId: job.id,
					workerId,
					attempts: job.attempts,
					maxAttempts: job.maxAttempts,
					lastError,
				});
			}

			return;
		}

		const lastError = formatMediaCleanupJobError(
			"MEDIA_CLEANUP_TARGET_DELETE_FAILED",
			error,
		);
		const failedFinalAttempt = job.attempts >= job.maxAttempts;

		if (failedFinalAttempt) {
			const marked = await markJobFailed(
				job,
				workerId,
				deps.now(),
				lastError,
				deps,
			);

			if (marked) {
				summary.failed += 1;
				deps.logger.error("media_cleanup_job_failed", error, {
					jobId: job.id,
					workerId,
					attempts: job.attempts,
					maxAttempts: job.maxAttempts,
					lastError,
				});
			}

			return;
		}

		const retryNow = deps.now();
		const runAt = getRetryRunAt(retryNow, job.attempts);
		const marked = await deps.markForRetry({
			id: job.id,
			workerId,
			now: retryNow,
			runAt,
			lastError,
		});

		if (marked) {
			summary.retried += 1;
			deps.logger.warn("media_cleanup_job_retry_scheduled", {
				jobId: job.id,
				workerId,
				attempts: job.attempts,
				maxAttempts: job.maxAttempts,
				runAt: runAt.toISOString(),
				lastError,
			});
		} else {
			deps.logger.warn("media_cleanup_job_mark_retry_skipped", {
				jobId: job.id,
				workerId,
			});
		}
	}
}

/**
 * Runs one cleanup batch and exits.
 *
 * This does not run continuously. Automatic cleanup depends on an external
 * scheduler running the server command again, for example every few minutes.
 */
export async function runMediaCleanupBatch(
	options: RunMediaCleanupBatchOptions = {},
): Promise<MediaCleanupBatchSummary> {
	const deps = getDeps(options.deps);
	const limit = normalizePositiveInteger(
		options.limit,
		DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT,
	);
	const workerId = options.workerId ?? createMediaCleanupWorkerId();
	const lockMs = normalizePositiveInteger(
		options.lockMs,
		DEFAULT_MEDIA_CLEANUP_LOCK_MS,
	);
	const deleteTimeoutMs = normalizePositiveInteger(
		options.deleteTimeoutMs,
		DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	);
	const startNow = deps.now();
	const summary: MediaCleanupBatchSummary = {
		workerId,
		limit,
		claimed: 0,
		succeeded: 0,
		retried: 0,
		failed: 0,
		expiredFailed: await deps.failExpiredExhaustedJobs({
			now: startNow,
			lastError: formatMediaCleanupJobError(
				"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED",
				"Attempts exhausted before cleanup completed",
			),
		}),
	};

	for (let processed = 0; processed < limit; processed += 1) {
		const claimNow = deps.now();
		const job = await deps.claimNextJob({
			workerId,
			now: claimNow,
			lockedUntil: new Date(claimNow.getTime() + lockMs),
		});

		if (!job) {
			break;
		}

		summary.claimed += 1;

		await processClaimedMediaCleanupJob({
			job,
			workerId,
			deleteTimeoutMs,
			deps,
			summary,
		});
	}

	deps.logger.info("media_cleanup_batch_completed", summary);

	return summary;
}
