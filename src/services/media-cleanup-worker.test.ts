import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	DEFAULT_MEDIA_CLEANUP_LOCK_MS,
} from "@/domains/media/application/run-media-cleanup-batch";
import { runMediaCleanupBatch } from "./media-cleanup-worker";

const mocks = vi.hoisted(() => ({
	claimNextMediaCleanupJob: vi.fn(),
	deleteMediaCleanupTarget: vi.fn(),
	loggerError: vi.fn(),
	loggerInfo: vi.fn(),
	loggerWarn: vi.fn(),
	markExpiredExhaustedMediaCleanupJobsFailed: vi.fn(),
	markMediaCleanupJobFailed: vi.fn(),
	markMediaCleanupJobForRetry: vi.fn(),
	markMediaCleanupJobSucceeded: vi.fn(),
}));

vi.mock("@/data/media-cleanup-job-repo", () => ({
	claimNextMediaCleanupJob: mocks.claimNextMediaCleanupJob,
	markExpiredExhaustedMediaCleanupJobsFailed:
		mocks.markExpiredExhaustedMediaCleanupJobsFailed,
	markMediaCleanupJobFailed: mocks.markMediaCleanupJobFailed,
	markMediaCleanupJobForRetry: mocks.markMediaCleanupJobForRetry,
	markMediaCleanupJobSucceeded: mocks.markMediaCleanupJobSucceeded,
}));

vi.mock(
	"@/domains/media/infrastructure/cloudinary-media-cleanup-targets",
	() => ({
		deleteMediaCleanupTarget: mocks.deleteMediaCleanupTarget,
	}),
);

vi.mock("@/lib/logger", () => ({
	logger: {
		error: mocks.loggerError,
		info: mocks.loggerInfo,
		warn: mocks.loggerWarn,
	},
}));

describe("media cleanup worker adapter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));
		vi.clearAllMocks();
		mocks.markExpiredExhaustedMediaCleanupJobsFailed.mockResolvedValue(0);
		mocks.claimNextMediaCleanupJob.mockResolvedValue(null);
		mocks.deleteMediaCleanupTarget.mockResolvedValue(undefined);
		mocks.markMediaCleanupJobSucceeded.mockResolvedValue(true);
	});

	it("runs a cleanup job through the default adapter wiring", async () => {
		mocks.claimNextMediaCleanupJob.mockResolvedValueOnce({
			id: "job-1",
			provider: "cloudinary",
			assetType: "image",
			providerAssetId: "products/one",
			attempts: 1,
			maxAttempts: 5,
		});

		const summary = await runMediaCleanupBatch({ limit: 1 });
		const claimOptions = mocks.claimNextMediaCleanupJob.mock.calls[0]?.[0];
		const workerId = claimOptions.workerId;

		expect(
			mocks.markExpiredExhaustedMediaCleanupJobsFailed,
		).toHaveBeenCalledWith({
			now: new Date("2026-06-09T10:00:00.000Z"),
			lastError:
				"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
		});
		expect(mocks.claimNextMediaCleanupJob).toHaveBeenCalledWith({
			workerId,
			now: new Date("2026-06-09T10:00:00.000Z"),
			lockedUntil: new Date(
				new Date("2026-06-09T10:00:00.000Z").getTime() +
					DEFAULT_MEDIA_CLEANUP_LOCK_MS,
			),
		});
		expect(typeof workerId).toBe("string");
		expect(workerId.length).toBeGreaterThan(0);
		expect(mocks.deleteMediaCleanupTarget).toHaveBeenCalledWith(
			{
				provider: "cloudinary",
				assetType: "image",
				providerAssetId: "products/one",
			},
			{ timeoutMs: DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS },
		);
		expect(mocks.markMediaCleanupJobSucceeded).toHaveBeenCalledWith({
			id: "job-1",
			workerId,
			now: new Date("2026-06-09T10:00:00.000Z"),
		});
		expect(summary).toMatchObject({
			workerId,
			limit: 1,
			claimed: 1,
			succeeded: 1,
			retried: 0,
			failed: 0,
			expiredFailed: 0,
		});
		expect(mocks.loggerInfo).toHaveBeenCalledWith(
			"media_cleanup_batch_completed",
			summary,
		);
	});
});
