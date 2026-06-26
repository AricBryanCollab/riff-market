import type { AppError, AppErrorKind } from "@/domains/shared/domain/result";

export type RequestErrorOptions = {
	readonly code?: string;
	readonly cause?: unknown;
	readonly details?: unknown;
	readonly status?: number;
};

export class RequestError extends Error {
	readonly code?: string;
	readonly details?: unknown;
	readonly status: number;

	constructor(message: string, options: RequestErrorOptions = {}) {
		super(
			message,
			options.cause === undefined ? undefined : { cause: options.cause },
		);
		this.name = "RequestError";
		this.code = options.code;
		this.details = options.details;
		this.status = options.status ?? 400;
	}
}

export function toRequestError<TError extends AppError>(
	error: TError,
): RequestError {
	return new RequestError(error.message, {
		code: error.code,
		details: error.details,
		status: statusForAppError(error),
	});
}

export function statusForAppError(error: AppError): number {
	return statusForAppErrorCode(error.code) ?? statusForAppErrorKind(error.kind);
}

export function statusForAppErrorKind(kind: AppErrorKind): number {
	switch (kind) {
		case "authorization":
			return 403;
		case "not-found":
			return 404;
		case "conflict":
			return 409;
		case "validation":
			return 400;
		case "invariant":
		case "unexpected":
			return 500;
	}
}

function statusForAppErrorCode(code: string): number | undefined {
	return appErrorStatusByCode[code];
}

const appErrorStatusByCode: Readonly<Record<string, number>> = {
	LISTING_COMMAND_IMAGE_UPLOAD_FAILED: 400,
};
