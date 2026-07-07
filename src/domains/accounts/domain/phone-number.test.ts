import { describe, expect, it } from "vitest";
import { isValidPhoneNumber } from "./phone-number";

describe("isValidPhoneNumber", () => {
	it("rejects nullish or empty input because it is not a phone number", () => {
		expect(isValidPhoneNumber(null)).toBe(false);
		expect(isValidPhoneNumber("")).toBe(false);
		expect(isValidPhoneNumber("   ")).toBe(false);
	});

	it("accepts 10 to 12 digit numbers", () => {
		expect(isValidPhoneNumber("0123456789")).toBe(true);
		expect(isValidPhoneNumber("012345678901")).toBe(true);
	});

	it("rejects numbers outside the 10-12 digit range", () => {
		expect(isValidPhoneNumber("012345678")).toBe(false);
		expect(isValidPhoneNumber("0123456789012")).toBe(false);
	});

	it("rejects anything that is not digits only", () => {
		expect(isValidPhoneNumber("01234abcde")).toBe(false);
		expect(isValidPhoneNumber("0123-456-789")).toBe(false);
		expect(isValidPhoneNumber("0123 456 7890")).toBe(false);
	});
});
