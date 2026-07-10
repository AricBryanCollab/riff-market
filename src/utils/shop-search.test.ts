import { describe, expect, it } from "vitest";
import {
	getOptionalListingPriceSearchInput,
	parseOptionalListingPriceSearchInput,
} from "./shop-search";

describe("shop search price input", () => {
	it("distinguishes empty, valid, and invalid listing price input", () => {
		expect(parseOptionalListingPriceSearchInput("")).toEqual({
			status: "empty",
		});
		expect(parseOptionalListingPriceSearchInput(" 19900 ")).toEqual({
			status: "valid",
			value: "19900",
		});
		expect(parseOptionalListingPriceSearchInput("19.9")).toEqual({
			status: "invalid",
			message: "Listing price must use whole TWD amounts",
		});
	});

	it("keeps URL search normalization lossy for invalid listing prices", () => {
		expect(getOptionalListingPriceSearchInput("19900")).toBe("19900");
		expect(getOptionalListingPriceSearchInput("19.9")).toBeUndefined();
		expect(getOptionalListingPriceSearchInput("")).toBeUndefined();
	});
});
