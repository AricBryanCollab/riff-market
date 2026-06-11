import { describe, expect, it } from "vitest";
import {
	DEFAULT_PRODUCT_CURRENCY_CODE,
	legacyFloatPriceToCents,
	normalizeProductMoney,
	parseOptionalProductPriceInputToCents,
	parseProductPriceInputToCents,
	priceCentsToDecimalPrice,
	toProductMoneyPersistence,
	toProductPriceRangePersistence,
} from "./product-money";

describe("product money mapping", () => {
	it("parses create/update price inputs as integer cents", () => {
		expect(parseProductPriceInputToCents("19")).toBe(1900);
		expect(parseProductPriceInputToCents("19.9")).toBe(1990);
		expect(parseProductPriceInputToCents("19.99")).toBe(1999);
		expect(parseProductPriceInputToCents(19.99)).toBe(1999);
	});

	it("rejects live price inputs with more than two decimal places", () => {
		expect(() => parseProductPriceInputToCents("19.999")).toThrow(
			"Product price must use at most two decimal places",
		);
		expect(() => parseProductPriceInputToCents(-1)).toThrow(
			"Product price must be a non-negative finite number",
		);
	});

	it("parses optional query prices only when present", () => {
		expect(parseOptionalProductPriceInputToCents(undefined)).toBeUndefined();
		expect(parseOptionalProductPriceInputToCents(null)).toBeUndefined();
		expect(parseOptionalProductPriceInputToCents("")).toBeUndefined();
		expect(parseOptionalProductPriceInputToCents("19.99")).toBe(1999);
	});

	it("rounds legacy float prices deterministically for backfill compatibility", () => {
		expect(legacyFloatPriceToCents(19.994)).toBe(1999);
		expect(legacyFloatPriceToCents(19.995)).toBe(2000);
		expect(legacyFloatPriceToCents(0.1)).toBe(10);
	});

	it("creates dual-write persistence values for product prices", () => {
		expect(toProductMoneyPersistence("49.90")).toEqual({
			price: 49.9,
			priceCents: 4990,
			currencyCode: DEFAULT_PRODUCT_CURRENCY_CODE,
		});
	});

	it("prefers persisted cents over legacy float values on reads", () => {
		expect(
			normalizeProductMoney({
				id: "prod-1",
				price: 19.99,
				priceCents: 2000,
				currencyCode: "USD",
			}),
		).toMatchObject({
			id: "prod-1",
			price: 20,
			priceCents: 2000,
			currencyCode: "USD",
		});
	});

	it("falls back to legacy float prices only when cents are absent", () => {
		expect(
			normalizeProductMoney({
				id: "prod-1",
				price: 19.995,
				priceCents: null,
				currencyCode: null,
			}),
		).toMatchObject({
			price: 20,
			priceCents: 2000,
			currencyCode: DEFAULT_PRODUCT_CURRENCY_CODE,
		});
	});

	it("builds cent-based price ranges with legacy float fallback ranges", () => {
		expect(
			toProductPriceRangePersistence({
				priceMinCents: 1050,
				priceMaxCents: 2099,
			}),
		).toEqual({
			priceCents: {
				gte: 1050,
				lte: 2099,
			},
			legacyPrice: {
				gte: 10.5,
				lte: 20.99,
			},
		});
	});

	it("formats cents back to decimal prices for existing UI compatibility", () => {
		expect(priceCentsToDecimalPrice(12345)).toBe(123.45);
	});
});
