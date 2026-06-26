import { describe, expect, it } from "vitest";
import { RequestError } from "./request-error";
import {
	getRequestLogOutcome,
	getRequestLogStatusCode,
} from "./request-log-status";

describe("getRequestLogStatusCode", () => {
	it("uses response status when middleware returns a Response", () => {
		expect(
			getRequestLogStatusCode(new Response(null, { status: 204 }), {
				didThrow: false,
			}),
		).toBe(204);
	});

	it("uses nested response status when TanStack request middleware returns one", () => {
		expect(
			getRequestLogStatusCode(
				{ response: new Response(null, { status: 404 }) },
				{ didThrow: false },
			),
		).toBe(404);
	});

	it("treats successful plain server-function values as success", () => {
		expect(getRequestLogStatusCode({ count: 3 }, { didThrow: false })).toBe(
			200,
		);
	});

	it("keeps thrown middleware paths as server errors", () => {
		expect(getRequestLogStatusCode(undefined, { didThrow: true })).toBe(500);
	});

	it("uses thrown request-error status codes", () => {
		expect(
			getRequestLogStatusCode(undefined, {
				didThrow: true,
				error: new RequestError("Listing not found", { status: 404 }),
			}),
		).toBe(404);
	});

	it("classifies request outcomes from status codes", () => {
		expect(getRequestLogOutcome(200)).toBe("success");
		expect(getRequestLogOutcome(404)).toBe("warning");
		expect(getRequestLogOutcome(500)).toBe("error");
	});
});
