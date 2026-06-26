export type MediaCleanupTarget = {
	provider: string;
	assetType: string;
	providerAssetId: string;
};

export type ClaimedMediaCleanupJob = MediaCleanupTarget & {
	id: string;
	attempts: number;
	maxAttempts: number;
};

export type MediaCleanupJobFailureTransition =
	| {
			readonly action: "fail";
			readonly lastError: string;
	  }
	| {
			readonly action: "retry";
			readonly lastError: string;
			readonly runAt: Date;
	  };

const LAST_ERROR_MAX_LENGTH = 500;
const RETRY_DELAYS_MS = [
	60 * 1000,
	5 * 60 * 1000,
	15 * 60 * 1000,
	60 * 60 * 1000,
] as const;

export class UnsupportedMediaCleanupTargetError extends Error {
	constructor(target: MediaCleanupTarget) {
		super(`${target.provider}/${target.assetType}`);
		this.name = "UnsupportedMediaCleanupTargetError";
	}
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

export function getMediaCleanupAttemptsExhaustedError(): string {
	return formatMediaCleanupJobError(
		"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED",
		"Attempts exhausted before cleanup completed",
	);
}

export function getMediaCleanupRetryRunAt(now: Date, attempts: number): Date {
	const index = Math.max(0, attempts - 1);
	const retryDelayMs =
		RETRY_DELAYS_MS[Math.min(index, RETRY_DELAYS_MS.length - 1)];

	return new Date(now.getTime() + retryDelayMs);
}

export class MediaCleanupJob {
	private constructor(private readonly job: ClaimedMediaCleanupJob) {}

	static fromClaimed(job: ClaimedMediaCleanupJob): MediaCleanupJob {
		return new MediaCleanupJob(job);
	}

	get id(): string {
		return this.job.id;
	}

	get attempts(): number {
		return this.job.attempts;
	}

	get maxAttempts(): number {
		return this.job.maxAttempts;
	}

	get target(): MediaCleanupTarget {
		return {
			provider: this.job.provider,
			assetType: this.job.assetType,
			providerAssetId: this.job.providerAssetId,
		};
	}

	resolveDeletionFailure(
		error: unknown,
		now: Date,
	): MediaCleanupJobFailureTransition {
		if (error instanceof UnsupportedMediaCleanupTargetError) {
			return {
				action: "fail",
				lastError: formatMediaCleanupJobError(
					"UNSUPPORTED_MEDIA_CLEANUP_TARGET",
					error,
				),
			};
		}

		const lastError = formatMediaCleanupJobError(
			"MEDIA_CLEANUP_TARGET_DELETE_FAILED",
			error,
		);

		if (this.attempts >= this.maxAttempts) {
			return {
				action: "fail",
				lastError,
			};
		}

		return {
			action: "retry",
			runAt: getMediaCleanupRetryRunAt(now, this.attempts),
			lastError,
		};
	}
}
