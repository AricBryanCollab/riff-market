import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	DEFAULT_MEDIA_CLEANUP_LOCK_MS,
} from "@/domains/media/application/run-media-cleanup-batch";
import { runMediaCleanupBatch } from "./media-cleanup-worker";

const mocks = vi.hoisted(() => {
	const jobQueue = {
		claimNext: vi.fn(),
		failExpiredExhausted: vi.fn(),
		markFailed: vi.fn(),
		markForRetry: vi.fn(),
		markSucceeded: vi.fn(),
	};

	return {
		deleteMediaCleanupTarget: vi.fn(),
		jobQueue,
		loggerError: vi.fn(),
		loggerInfo: vi.fn(),
		loggerWarn: vi.fn(),
		PrismaMediaCleanupJobQueue: vi.fn(() => jobQueue),
	};
});

vi.mock("@/data/connect-db", () => ({
	prisma: {},
}));

vi.mock(
	"@/domains/media/infrastructure/cloudinary-media-cleanup-targets",
	() => ({
		deleteMediaCleanupTarget: mocks.deleteMediaCleanupTarget,
	}),
);

vi.mock(
	"@/domains/media/infrastructure/prisma-media-cleanup-job-queue",
	() => ({
		PrismaMediaCleanupJobQueue: mocks.PrismaMediaCleanupJobQueue,
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
		mocks.jobQueue.failExpiredExhausted.mockResolvedValue(0);
		mocks.jobQueue.claimNext.mockResolvedValue(null);
		mocks.deleteMediaCleanupTarget.mockResolvedValue(undefined);
		mocks.jobQueue.markSucceeded.mockResolvedValue(true);
	});

	it("runs a cleanup job through the default adapter wiring", async () => {
		mocks.jobQueue.claimNext.mockResolvedValueOnce({
			id: "job-1",
			provider: "cloudinary",
			assetType: "image",
			providerAssetId: "listings/one",
			attempts: 1,
			maxAttempts: 5,
		});

		const summary = await runMediaCleanupBatch({ limit: 1 });
		const claimOptions = mocks.jobQueue.claimNext.mock.calls[0]?.[0];
		const workerId = claimOptions.workerId;

		expect(mocks.jobQueue.failExpiredExhausted).toHaveBeenCalledWith({
			now: new Date("2026-06-09T10:00:00.000Z"),
			lastError:
				"MEDIA_CLEANUP_ATTEMPTS_EXHAUSTED: Attempts exhausted before cleanup completed",
		});
		expect(mocks.jobQueue.claimNext).toHaveBeenCalledWith({
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
				providerAssetId: "listings/one",
			},
			{ timeoutMs: DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS },
		);
		expect(mocks.jobQueue.markSucceeded).toHaveBeenCalledWith({
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
