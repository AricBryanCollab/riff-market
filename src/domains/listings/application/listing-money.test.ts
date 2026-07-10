import { describe, expect, it } from "vitest";
import {
	calculateListingCartSubtotal,
	DEFAULT_LISTING_CURRENCY_CODE,
	normalizeOptionalListingPriceInput,
	parseListingPriceInputToAmountMinor,
	parseOptionalListingPriceInputToAmountMinor,
	priceAmountMinorToDecimalPrice,
	toListingMoneyPersistence,
	toListingPriceRangePersistence,
} from "./listing-money";

describe("listing money mapping", () => {
	it("parses create/update price inputs as whole TWD amounts", () => {
		expect(DEFAULT_LISTING_CURRENCY_CODE).toBe("TWD");
		expect(parseListingPriceInputToAmountMinor("19900")).toBe(19900);
		expect(parseListingPriceInputToAmountMinor(19900)).toBe(19900);
	});

	it("rejects fractional listing prices for the TWD marketplace", () => {
		expect(() => parseListingPriceInputToAmountMinor("19.9")).toThrow(
			"Listing price must use whole TWD amounts",
		);
		expect(() => parseListingPriceInputToAmountMinor("19.99")).toThrow(
			"Listing price must use whole TWD amounts",
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
		expect(parseOptionalListingPriceInputToAmountMinor("19900")).toBe(19900);
	});

	it("normalizes optional query price input with the listing price parser", () => {
		expect(normalizeOptionalListingPriceInput(" 19900 ")).toBe("19900");
		expect(normalizeOptionalListingPriceInput("")).toBeUndefined();
		expect(() => normalizeOptionalListingPriceInput("1e3")).toThrow(
			"Listing price must be a non-negative decimal amount",
		);
		expect(() => normalizeOptionalListingPriceInput("19.9")).toThrow(
			"Listing price must use whole TWD amounts",
		);
	});

	it("creates minor-amount persistence values for listing prices", () => {
		expect(toListingMoneyPersistence("49900")).toEqual({
			priceAmountMinor: 49900,
			currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
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

	it("calculates cart subtotals with Money arithmetic", () => {
		const result = calculateListingCartSubtotal([
			{ priceAmountMinor: 1250, currencyCode: "TWD", quantity: 2 },
			{ priceAmountMinor: 750, currencyCode: "TWD", quantity: 1 },
		]);

		expect(result.status).toBe("valid");
		expect(result.subtotal.toJSON()).toEqual({
			amountMinor: 3250,
			currencyCode: "TWD",
		});
	});

	it("returns an invalid subtotal result for mixed currencies", () => {
		const result = calculateListingCartSubtotal([
			{ priceAmountMinor: 1250, currencyCode: "TWD", quantity: 1 },
			{ priceAmountMinor: 750, currencyCode: "EUR", quantity: 1 },
		]);

		expect(result.status).toBe("invalid");
		expect(result.subtotal.toJSON()).toEqual({
			amountMinor: 0,
			currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
		});
		expect(result.status === "invalid" ? result.error : undefined).toEqual({
			code: "LISTING_CART_SUBTOTAL_INVALID_MONEY",
			message: "Cart subtotal requires listings in a single currency",
			kind: "invariant",
		});
	});

	it("converts minor amounts back to whole TWD prices for form input boundaries", () => {
		expect(priceAmountMinorToDecimalPrice(12345)).toBe(12345);
	});
});
