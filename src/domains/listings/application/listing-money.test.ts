import { describe, expect, it } from "vitest";
import {
	DEFAULT_LISTING_CURRENCY_CODE,
	normalizeListingMoney,
	parseListingPriceInputToCents,
	parseOptionalListingPriceInputToCents,
	priceCentsToDecimalPrice,
	toListingMoneyPersistence,
	toListingPriceRangePersistence,
} from "./listing-money";

describe("listing money mapping", () => {
	it("parses create/update price inputs as integer cents", () => {
		expect(parseListingPriceInputToCents("19")).toBe(1900);
		expect(parseListingPriceInputToCents("19.9")).toBe(1990);
		expect(parseListingPriceInputToCents("19.99")).toBe(1999);
		expect(parseListingPriceInputToCents(19.99)).toBe(1999);
	});

	it("rejects live price inputs with more than two decimal places", () => {
		expect(() => parseListingPriceInputToCents("19.999")).toThrow(
			"Listing price must use at most two decimal places",
		);
		expect(() => parseListingPriceInputToCents(-1)).toThrow(
			"Listing price must be a non-negative finite number",
		);
	});

	it("parses optional query prices only when present", () => {
		expect(parseOptionalListingPriceInputToCents(undefined)).toBeUndefined();
		expect(parseOptionalListingPriceInputToCents(null)).toBeUndefined();
		expect(parseOptionalListingPriceInputToCents("")).toBeUndefined();
		expect(parseOptionalListingPriceInputToCents("19.99")).toBe(1999);
	});

	it("creates cent-based persistence values for listing prices", () => {
		expect(toListingMoneyPersistence("49.90")).toEqual({
			priceCents: 4990,
			currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
		});
	});

	it("normalizes persisted cents to decimal prices for existing UI compatibility", () => {
		expect(
			normalizeListingMoney({
				id: "listing-1",
				priceCents: 2000,
				currencyCode: "USD",
			}),
		).toMatchObject({
			id: "listing-1",
			price: 20,
			priceCents: 2000,
			currencyCode: "USD",
		});
	});

	it("builds cent-based price ranges", () => {
		expect(
			toListingPriceRangePersistence({
				priceMinCents: 1050,
				priceMaxCents: 2099,
			}),
		).toEqual({
			gte: 1050,
			lte: 2099,
		});
	});

	it("formats cents back to decimal prices for existing UI compatibility", () => {
		expect(priceCentsToDecimalPrice(12345)).toBe(123.45);
	});
});
