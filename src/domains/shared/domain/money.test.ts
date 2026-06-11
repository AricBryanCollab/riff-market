import { describe, expect, it } from "vitest";

import { Money } from "./money";

describe("Money", () => {
	it("creates immutable money from integer cents and currency code", () => {
		const money = Money.fromCents(1999, "USD");

		expect(money.amountCents).toBe(1999);
		expect(money.currencyCode).toBe("USD");
		expect(money.toJSON()).toEqual({
			amountCents: 1999,
			currencyCode: "USD",
		});
	});

	it.each([
		["fractional cents", 10.5],
		["negative cents", -1],
		["unsafe cents", Number.MAX_SAFE_INTEGER + 1],
		["NaN", Number.NaN],
		["infinity", Number.POSITIVE_INFINITY],
	])("rejects %s", (_label, amountCents) => {
		expect(() => Money.fromCents(amountCents, "USD")).toThrow(
			/integer cents|negative/,
		);
	});

	it.each([
		"usd",
		"US",
		"USDA",
		"U$D",
		" USD",
	])("rejects invalid currency code %s", (currencyCode) => {
		expect(() => Money.fromCents(100, currencyCode)).toThrow(
			/three-letter uppercase ISO code/,
		);
	});

	it("adds and subtracts amounts with the same currency", () => {
		const price = Money.fromCents(1250, "USD");
		const shipping = Money.fromCents(499, "USD");

		expect(price.add(shipping)).toEqual(Money.fromCents(1749, "USD"));
		expect(price.subtract(Money.fromCents(250, "USD"))).toEqual(
			Money.fromCents(1000, "USD"),
		);
	});

	it("rejects arithmetic across currencies", () => {
		const usd = Money.fromCents(100, "USD");
		const eur = Money.fromCents(100, "EUR");

		expect(() => usd.add(eur)).toThrow(/currency mismatch/);
		expect(() => usd.subtract(eur)).toThrow(/currency mismatch/);
		expect(() => usd.isGreaterThan(eur)).toThrow(/currency mismatch/);
	});

	it("multiplies by a non-negative integer quantity", () => {
		const unitPrice = Money.fromCents(2500, "USD");

		expect(unitPrice.multiply(3)).toEqual(Money.fromCents(7500, "USD"));
		expect(unitPrice.multiply(0)).toEqual(Money.zero("USD"));
		expect(() => unitPrice.multiply(1.5)).toThrow(/quantity/);
		expect(() => unitPrice.multiply(-1)).toThrow(/quantity/);
	});
});
