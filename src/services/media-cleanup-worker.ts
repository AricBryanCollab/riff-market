import { randomUUID } from "node:crypto";
import { prisma } from "@/data/connect-db";
import {
	DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT,
	DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	DEFAULT_MEDIA_CLEANUP_LOCK_MS,
	formatMediaCleanupJobError,
	type MediaCleanupBatchPorts,
	type MediaCleanupBatchSummary,
	type RunMediaCleanupBatchUseCaseOptions,
	runMediaCleanupBatchUseCase,
} from "@/domains/media/application/run-media-cleanup-batch";
import { deleteMediaCleanupTarget } from "@/domains/media/infrastructure/cloudinary-media-cleanup-targets";
import { PrismaMediaCleanupJobQueue } from "@/domains/media/infrastructure/prisma-media-cleanup-job-queue";
import { logger } from "@/lib/logger";

export {
	DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT,
	DEFAULT_MEDIA_CLEANUP_DELETE_TIMEOUT_MS,
	DEFAULT_MEDIA_CLEANUP_LOCK_MS,
	formatMediaCleanupJobError,
};

export type { MediaCleanupBatchPorts, MediaCleanupBatchSummary };

export type RunMediaCleanupBatchOptions = Omit<
	RunMediaCleanupBatchUseCaseOptions,
	"ports" | "workerId"
> & {
	workerId?: string;
	ports?: MediaCleanupBatchPorts;
};

const defaultPorts: MediaCleanupBatchPorts = {
	jobQueue: new PrismaMediaCleanupJobQueue(prisma),
	targetDeletion: {
		deleteTarget: deleteMediaCleanupTarget,
	},
	logger,
	clock: {
		now: () => new Date(),
	},
};

export function createMediaCleanupWorkerId() {
	return `media-cleanup-${new Date().toISOString()}-${randomUUID().slice(0, 8)}`;
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
	return runMediaCleanupBatchUseCase({
		limit: options.limit,
		workerId: options.workerId ?? createMediaCleanupWorkerId(),
		lockMs: options.lockMs,
		deleteTimeoutMs: options.deleteTimeoutMs,
		ports: options.ports ?? defaultPorts,
	});
}
