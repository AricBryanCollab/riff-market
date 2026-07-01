import { describe, expect, it } from "vitest";
import {
	type ClaimedMediaCleanupJob,
	formatMediaCleanupJobError,
	getMediaCleanupAttemptsExhaustedError,
	getMediaCleanupRetryRunAt,
	MediaCleanupJob,
	UnsupportedMediaCleanupTargetError,
} from "./media-cleanup-job";

const fixedNow = new Date("2026-06-09T10:00:00.000Z");

function makeClaimedJob(
	overrides: Partial<ClaimedMediaCleanupJob> = {},
): ClaimedMediaCleanupJob {
	return {
		id: "job-1",
		provider: "cloudinary",
		assetType: "image",
		providerAssetId: "listings/one",
		attempts: 1,
		maxAttempts: 5,
		...overrides,
	};
}

describe("MediaCleanupJob", () => {
	it("schedules retry for a non-final deletion failure", () => {
		const job = MediaCleanupJob.fromClaimed(makeClaimedJob({ attempts: 2 }));

		expect(
			job.resolveDeletionFailure(new Error("network down"), fixedNow),
		).toEqual({
			action: "retry",
			runAt: new Date("2026-06-09T10:05:00.000Z"),
			lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: network down",
		});
	});

	it("marks final deletion failure failed", () => {
		const job = MediaCleanupJob.fromClaimed(
			makeClaimedJob({ attempts: 5, maxAttempts: 5 }),
		);

		expect(
			job.resolveDeletionFailure(new Error("still down"), fixedNow),
		).toEqual({
			action: "fail",
			lastError: "MEDIA_CLEANUP_TARGET_DELETE_FAILED: still down",
		});
	});

	it("marks unsupported cleanup targets failed without retry", () => {
		const job = MediaCleanupJob.fromClaimed(
			makeClaimedJob({
				provider: "s3",
				assetType: "video",
				providerAssetId: "videos/one",
			}),
		);

		expect(
			job.resolveDeletionFailure(
				new UnsupportedMediaCleanupTargetError(job.target),
				fixedNow,
			),
		).toEqual({
			action: "fail",
			lastError: "UNSUPPORTED_MEDIA_CLEANUP_TARGET: s3/video",
		});
	});

	it("caps retry delay after the fourth attempt", () => {
		expect(getMediaCleanupRetryRunAt(fixedNow, 1)).toEqual(
			new Date("2026-06-09T10:01:00.000Z"),
		);
		expect(getMediaCleanupRetryRunAt(fixedNow, 2)).toEqual(
			new Date("2026-06-09T10:05:00.000Z"),
		);
		expect(getMediaCleanupRetryRunAt(fixedNow, 3)).toEqual(
			new Date("2026-06-09T10:15:00.000Z"),
		);
		expect(getMediaCleanupRetryRunAt(fixedNow, 4)).toEqual(
			new Date("2026-06-09T11:00:00.000Z"),
		);
		expect(getMediaCleanupRetryRunAt(fixedNow, 9)).toEqual(
			new Date("2026-06-09T11:00:00.000Z"),
		);
	});

	it("formats bounded last-error strings", () => {
		const formatted = formatMediaCleanupJobError(
			"MEDIA_CLEANUP_TARGET_DELETE_FAILED",
			"x".repeat(600),
		);

		expect(formatted).toHaveLength(500);
		expect(formatted.startsWith("MEDIA_CLEANUP_TARGET_DELETE_FAILED:")).toBe(
			true,
		);
	});

	it("formats exhausted attempts consistently", () => {
		expect(getMediaCleanupAttemptsExhaustedError()).toBe(
			"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
		);
	});
});
