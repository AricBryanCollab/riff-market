import { describe, expect, it } from "vitest";
import { isAppErrorKind, toAppErrorStatus } from "./app-error-status";

describe("app error request status", () => {
	it.each([
		["validation", 400],
		["authorization", 403],
		["not-found", 404],
		["conflict", 409],
		["invariant", 500],
		["unexpected", 500],
	] as const)("maps %s errors to %s", (kind, status) => {
		expect(toAppErrorStatus(kind)).toBe(status);
	});

	it("identifies valid app error kinds without accepting inherited keys", () => {
		expect(isAppErrorKind("validation")).toBe(true);
		expect(isAppErrorKind("legacy")).toBe(false);
		expect(isAppErrorKind("toString")).toBe(false);
		expect(isAppErrorKind(undefined)).toBe(false);
	});
});
