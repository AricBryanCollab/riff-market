import { describe, expect, it } from "vitest";
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "./listing-attributes";

describe("listing attributes", () => {
	it("defines the allowed category and condition values", () => {
		expect(LISTING_CATEGORIES).toEqual([
			"ELECTRIC",
			"ACOUSTIC",
			"KEYBOARD",
			"PEDALS",
			"ACCESSORY",
		]);
		expect(LISTING_CONDITIONS).toEqual(["NEW", "USED", "MINT"]);
	});
});
