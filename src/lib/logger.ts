import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import pino from "pino";

type ErrorDetails = {
	type: string;
	message: string;
	stack?: string;
};

export type RequestContext = {
	requestId: string;
	method: string;
	path: string;
	statusCode?: number;
	durationMs?: number;
	userId?: string;
	userRole?: string;
	requestStartAt?: number;
	outcome?: "success" | "warning" | "error";
	error?: ErrorDetails;
	resource?: string;
	relatedId?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

const runtimeEnvironment = (
	globalThis as typeof globalThis & {
		process?: {
			env?: Record<string, string | undefined>;
			version?: string;
		};
	}
).process;

const loggerNodeEnv = runtimeEnvironment?.env?.NODE_ENV;
const loggerLogLevel =
	runtimeEnvironment?.env?.LOG_LEVEL ||
	(loggerNodeEnv === "test" ? "fatal" : "info");
const loggerNodeVersion = runtimeEnvironment?.version || "unknown";

const baseLogger = pino({
	level: loggerLogLevel,
	base: {
		service: "riff-market-api",
		environment: loggerNodeEnv || "development",
		nodeVersion: loggerNodeVersion,
	},
	timestamp: pino.stdTimeFunctions.isoTime,
});

export const toErrorDetails = (error: unknown): ErrorDetails => {
	if (error instanceof Error) {
		return {
			type: error.name,
			message: error.message,
			...(error.stack && { stack: error.stack }),
		};
	}

	return {
		type: typeof error,
		message: String(error),
	};
};

const withContext = (extra: Record<string, unknown>) => {
	const context = requestContextStorage.getStore();
	return context ? { ...context, ...extra } : extra;
};

export const createRequestContext = (request: Request) => {
	const requestId = request.headers.get("x-request-id") || randomUUID();
	const url = new URL(request.url);

	return {
		requestId,
		requestStartAt: Date.now(),
		method: request.method,
		path: url.pathname,
	};
};

export const withRequestContext = async <T>(
	context: RequestContext,
	runner: () => Promise<T>,
): Promise<T> => {
	return requestContextStorage.run(context, runner);
};

export const getRequestContext = () => requestContextStorage.getStore();

export const updateRequestContext = (updates: Partial<RequestContext>) => {
	const context = requestContextStorage.getStore();
	if (!context) {
		return;
	}

	Object.assign(context, updates);
};

export const logger = {
	info: (message: string, extra?: Record<string, unknown>) => {
		baseLogger.info(withContext(extra ?? {}), message);
	},
	warn: (message: string, extra?: Record<string, unknown>) => {
		baseLogger.warn(withContext(extra ?? {}), message);
	},
	error: (message: string, error: unknown, extra?: Record<string, unknown>) => {
		baseLogger.error(
			withContext({
				error: toErrorDetails(error),
				...(extra ?? {}),
			}),
			message,
		);
	},
	child: (extra?: Record<string, unknown>) => ({
		info: (message: string, payload?: Record<string, unknown>) => {
			baseLogger.info(
				withContext({ ...(extra ?? {}), ...(payload ?? {}) }),
				message,
			);
		},
		warn: (message: string, payload?: Record<string, unknown>) => {
			baseLogger.warn(
				withContext({ ...(extra ?? {}), ...(payload ?? {}) }),
				message,
			);
		},
		error: (
			message: string,
			error: unknown,
			payload?: Record<string, unknown>,
		) => {
			baseLogger.error(
				withContext({
					error: toErrorDetails(error),
					...(extra ?? {}),
					...(payload ?? {}),
				}),
				message,
			);
		},
	}),
};
