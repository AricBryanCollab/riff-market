import { describe, expect, it } from "vitest";
import {
	DEFAULT_LISTING_CURRENCY_CODE,
	normalizeListingMoney,
	parseListingPriceInputToAmountMinor,
	parseOptionalListingPriceInputToAmountMinor,
	priceAmountMinorToDecimalPrice,
	toListingMoneyPersistence,
	toListingPriceRangePersistence,
} from "./listing-money";

describe("listing money mapping", () => {
	it("parses create/update price inputs as integer minor amounts", () => {
		expect(parseListingPriceInputToAmountMinor("19")).toBe(1900);
		expect(parseListingPriceInputToAmountMinor("19.9")).toBe(1990);
		expect(parseListingPriceInputToAmountMinor("19.99")).toBe(1999);
		expect(parseListingPriceInputToAmountMinor(19.99)).toBe(1999);
	});

	it("rejects live price inputs with more than two decimal places", () => {
		expect(() => parseListingPriceInputToAmountMinor("19.999")).toThrow(
			"Listing price must use at most two decimal places",
		);
		expect(() => parseListingPriceInputToAmountMinor(-1)).toThrow(
			"Listing price must be a non-negative finite number",
		);
	});

	it("parses optional query prices only when present", () => {
		expect(
			parseOptionalListingPriceInputToAmountMinor(undefined),
		).toBeUndefined();
		expect(parseOptionalListingPriceInputToAmountMinor(null)).toBeUndefined();
		expect(parseOptionalListingPriceInputToAmountMinor("")).toBeUndefined();
		expect(parseOptionalListingPriceInputToAmountMinor("19.99")).toBe(1999);
	});

	it("creates minor-amount persistence values for listing prices", () => {
		expect(toListingMoneyPersistence("49.90")).toEqual({
			priceAmountMinor: 4990,
			currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
		});
	});

	it("normalizes persisted minor amounts to decimal prices for existing UI compatibility", () => {
		expect(
			normalizeListingMoney({
				id: "listing-1",
				priceAmountMinor: 2000,
				currencyCode: "USD",
			}),
		).toMatchObject({
			id: "listing-1",
			price: 20,
			priceAmountMinor: 2000,
			priceCents: 2000,
			currencyCode: "USD",
		});
	});

	it("builds minor-amount price ranges", () => {
		expect(
			toListingPriceRangePersistence({
				priceMinAmountMinor: 1050,
				priceMaxAmountMinor: 2099,
			}),
		).toEqual({
			gte: 1050,
			lte: 2099,
		});
	});

	it("formats minor amounts back to decimal prices for existing UI compatibility", () => {
		expect(priceAmountMinorToDecimalPrice(12345)).toBe(123.45);
	});
});
