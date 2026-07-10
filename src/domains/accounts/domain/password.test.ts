import { describe, expect, it } from "vitest";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "./password";

describe("isValidPassword", () => {
	it("exports an 8-character minimum", () => {
		expect(MIN_PASSWORD_LENGTH).toBe(8);
	});

	it("accepts a password that meets length and complexity", () => {
		expect(isValidPassword("Password1!")).toBe(true);
	});

	it("rejects passwords shorter than the minimum", () => {
		expect(isValidPassword("Pass1!")).toBe(false);
	});

	it("rejects passwords missing a lowercase letter", () => {
		expect(isValidPassword("PASSWORD1!")).toBe(false);
	});

	it("rejects passwords missing an uppercase letter", () => {
		expect(isValidPassword("password1!")).toBe(false);
	});

	it("rejects passwords missing a digit", () => {
		expect(isValidPassword("Password!")).toBe(false);
	});

	it("rejects passwords missing a special character", () => {
		expect(isValidPassword("Password1")).toBe(false);
	});
});
