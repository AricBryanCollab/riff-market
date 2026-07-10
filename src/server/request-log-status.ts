import { RequestError } from "@/server/request-error";

export type RequestLogOutcome = "success" | "warning" | "error";

export function getRequestLogStatusCode(
	result: unknown,
	options: { readonly didThrow: boolean; readonly error?: unknown },
): number {
	const response = getResponseFromMiddlewareResult(result);

	if (response) {
		return response.status;
	}

	if (options.didThrow) {
		return getThrownErrorStatusCode(options.error) ?? 500;
	}

	return 200;
}

export function getRequestLogOutcome(statusCode: number): RequestLogOutcome {
	if (statusCode >= 500) {
		return "error";
	}

	if (statusCode >= 400) {
		return "warning";
	}

	return "success";
}

function getResponseFromMiddlewareResult(
	result: unknown,
): Response | undefined {
	if (result instanceof Response) {
		return result;
	}

	if (hasResponse(result)) {
		return result.response;
	}

	return undefined;
}

function getThrownErrorStatusCode(error: unknown): number | undefined {
	if (error instanceof RequestError) {
		return error.status;
	}

	if (error instanceof Response) {
		return error.status;
	}

	return undefined;
}

function hasResponse(
	result: unknown,
): result is { readonly response: Response } {
	return (
		typeof result === "object" &&
		result !== null &&
		"response" in result &&
		result.response instanceof Response
	);
}
