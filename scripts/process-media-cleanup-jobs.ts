import { prisma } from "../src/data/connect-db";
import {
	DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT,
	runMediaCleanupBatch,
} from "../src/services/media-cleanup-worker";

type ParsedArgs = {
	limit?: number;
	workerId?: string;
};

function getArgValue(argv: string[], name: string): string | undefined {
	const prefix = `${name}=`;
	const inlineValue = argv.find((arg) => arg.startsWith(prefix));

	if (inlineValue) {
		return inlineValue.slice(prefix.length);
	}

	const index = argv.indexOf(name);
	return index >= 0 ? argv[index + 1] : undefined;
}

function parsePositiveIntegerArg(value: string | undefined, name: string) {
	if (value === undefined) {
		return undefined;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`${name} must be a positive integer`);
	}

	return parsed;
}

function parseArgs(argv: string[]): ParsedArgs {
	return {
		limit: parsePositiveIntegerArg(getArgValue(argv, "--limit"), "--limit"),
		workerId: getArgValue(argv, "--worker-id"),
	};
}

/**
 * Runs one cleanup batch and exits.
 *
 * This is a server command, not a browser Web Worker and not a continuous
 * background process. Automatic cleanup depends on a scheduler running this
 * command again, for example every few minutes.
 */
async function main() {
	const args = parseArgs(process.argv.slice(2));
	const summary = await runMediaCleanupBatch(args);

	console.info(
		[
			"Media cleanup complete:",
			`workerId=${summary.workerId}`,
			`limit=${summary.limit}`,
			`claimed=${summary.claimed}`,
			`succeeded=${summary.succeeded}`,
			`retried=${summary.retried}`,
			`failed=${summary.failed}`,
			`expiredFailed=${summary.expiredFailed}`,
		].join(" "),
	);
}

try {
	await main();
} catch (error) {
	console.error(
		`Media cleanup failed before completing a batch. Default limit is ${DEFAULT_MEDIA_CLEANUP_BATCH_LIMIT}.`,
		error,
	);
	process.exitCode = 1;
} finally {
	await prisma.$disconnect();
}
