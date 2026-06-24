export type RequestLogOutcome = "success" | "warning" | "error";

export function getRequestLogStatusCode(
	result: unknown,
	options: { readonly didThrow: boolean },
): number {
	const response = getResponseFromMiddlewareResult(result);

	if (response) {
		return response.status;
	}

	return options.didThrow ? 500 : 200;
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
