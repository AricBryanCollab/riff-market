import {
	type ClaimedMediaCleanupJob,
	formatMediaCleanupJobError,
	getMediaCleanupAttemptsExhaustedError,
	MediaCleanupJob,
	type MediaCleanupTarget,
} from "@/domains/media/domain/media-cleanup-job";

export const DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT = 50;
export const DEFAULT_MEDIA_CLEANUP_LOCK_MS = 5 * 60 * 1000;
export const DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS = 30 * 1000;

export type MediaCleanupLogger = {
	readonly error: (
		message: string,
		error: unknown,
		meta?: Record<string, unknown>,
	) => void;
	readonly info: (message: string, meta?: Record<string, unknown>) => void;
	readonly warn: (message: string, meta?: Record<string, unknown>) => void;
};

export interface MediaCleanupClock {
	now(): Date;
}

export interface MediaCleanupJobQueuePort {
	claimNext(options: {
		workerId: string;
		now: Date;
		lockedUntil: Date;
	}): Promise<ClaimedMediaCleanupJob | null>;
	failExpiredExhausted(options: {
		now: Date;
		lastError: string;
	}): Promise<number>;
	markFailed(options: {
		id: string;
		workerId: string;
		now: Date;
		lastError: string;
	}): Promise<boolean>;
	markForRetry(options: {
		id: string;
		workerId: string;
		now: Date;
		runAt: Date;
		lastError: string;
	}): Promise<boolean>;
	markSucceeded(options: {
		id: string;
		workerId: string;
		now: Date;
	}): Promise<boolean>;
}

export interface MediaCleanupTargetDeletionPort {
	deleteTarget(
		target: MediaCleanupTarget,
		options: { timeoutMs: number },
	): Promise<void>;
}

export type MediaCleanupBatchPorts = {
	readonly jobQueue: MediaCleanupJobQueuePort;
	readonly targetDeletion: MediaCleanupTargetDeletionPort;
	readonly logger: MediaCleanupLogger;
	readonly clock: MediaCleanupClock;
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
	workerId: string;
	lockMs?: number;
	deleteTimeoutMs?: number;
	ports: MediaCleanupBatchPorts;
};

function normalizePositiveInteger(value: number | undefined, fallback: number) {
	if (value === undefined) {
		return fallback;
	}

	if (!Number.isInteger(value) || value < 1) {
		throw new Error("Media cleanup limit must be a positive integer");
	}

	return value;
}

async function markJobFailed(
	job: MediaCleanupJob,
	workerId: string,
	now: Date,
	lastError: string,
	ports: Pick<MediaCleanupBatchPorts, "jobQueue" | "logger">,
) {
	const marked = await ports.jobQueue.markFailed({
		id: job.id,
		workerId,
		now,
		lastError,
	});

	if (!marked) {
		ports.logger.warn("media_cleanup_job_mark_failed_skipped", {
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
	ports,
	summary,
}: {
	job: ClaimedMediaCleanupJob;
	workerId: string;
	deleteTimeoutMs: number;
	ports: MediaCleanupBatchPorts;
	summary: MediaCleanupBatchSummary;
}) {
	const cleanupJob = MediaCleanupJob.fromClaimed(job);

	try {
		await ports.targetDeletion.deleteTarget(cleanupJob.target, {
			timeoutMs: deleteTimeoutMs,
		});

		const marked = await ports.jobQueue.markSucceeded({
			id: cleanupJob.id,
			workerId,
			now: ports.clock.now(),
		});

		if (marked) {
			summary.succeeded += 1;
		} else {
			ports.logger.warn("media_cleanup_job_mark_succeeded_skipped", {
				jobId: cleanupJob.id,
				workerId,
			});
		}
	} catch (error) {
		const failureNow = ports.clock.now();
		const failure = cleanupJob.resolveDeletionFailure(error, failureNow);

		if (failure.action === "fail") {
			const marked = await markJobFailed(
				cleanupJob,
				workerId,
				failureNow,
				failure.lastError,
				ports,
			);

			if (marked) {
				summary.failed += 1;
				ports.logger.error("media_cleanup_job_failed", error, {
					jobId: cleanupJob.id,
					workerId,
					attempts: cleanupJob.attempts,
					maxAttempts: cleanupJob.maxAttempts,
					lastError: failure.lastError,
				});
			}

			return;
		}

		const marked = await ports.jobQueue.markForRetry({
			id: cleanupJob.id,
			workerId,
			now: failureNow,
			runAt: failure.runAt,
			lastError: failure.lastError,
		});

		if (marked) {
			summary.retried += 1;
			ports.logger.warn("media_cleanup_job_retry_scheduled", {
				jobId: cleanupJob.id,
				workerId,
				attempts: cleanupJob.attempts,
				maxAttempts: cleanupJob.maxAttempts,
				runAt: failure.runAt.toISOString(),
				lastError: failure.lastError,
			});
		} else {
			ports.logger.warn("media_cleanup_job_mark_retry_skipped", {
				jobId: cleanupJob.id,
				workerId,
			});
		}
	}
}

export async function runMediaCleanupBatch({
	limit: limitOption,
	workerId,
	lockMs: lockMsOption,
	deleteTimeoutMs: deleteTimeoutMsOption,
	ports,
}: RunMediaCleanupBatchOptions): Promise<MediaCleanupBatchSummary> {
	const limit = normalizePositiveInteger(
		limitOption,
		DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT,
	);
	const lockMs = normalizePositiveInteger(
		lockMsOption,
		DEFAULT_MEDIA_CLEANUP_LOCK_MS,
	);
	const deleteTimeoutMs = normalizePositiveInteger(
		deleteTimeoutMsOption,
		DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	);
	const startNow = ports.clock.now();
	const summary: MediaCleanupBatchSummary = {
		workerId,
		limit,
		claimed: 0,
		succeeded: 0,
		retried: 0,
		failed: 0,
		expiredFailed: await ports.jobQueue.failExpiredExhausted({
			now: startNow,
			lastError: getMediaCleanupAttemptsExhaustedError(),
		}),
	};

	for (let processed = 0; processed < limit; processed += 1) {
		const claimNow = ports.clock.now();
		const job = await ports.jobQueue.claimNext({
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
			ports,
			summary,
		});
	}

	ports.logger.info("media_cleanup_batch_completed", summary);

	return summary;
}

export { formatMediaCleanupJobError };
