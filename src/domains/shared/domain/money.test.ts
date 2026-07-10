import { describe, expect, it } from "vitest";

import { Money } from "./money";

describe("Money", () => {
	it("creates immutable money from integer minor amount and currency code", () => {
		const money = Money.fromMinor(1999, "USD");

		expect(money.amountMinor).toBe(1999);
		expect(money.currencyCode).toBe("USD");
		expect(money.toJSON()).toEqual({
			amountMinor: 1999,
			currencyCode: "USD",
		});
	});

	it.each([
		["fractional minor amount", 10.5],
		["negative minor amount", -1],
		["unsafe minor amount", Number.MAX_SAFE_INTEGER + 1],
		["NaN", Number.NaN],
		["infinity", Number.POSITIVE_INFINITY],
	])("rejects %s", (_label, amountMinor) => {
		expect(() => Money.fromMinor(amountMinor, "USD")).toThrow(
			/integer minor units|negative/,
		);
	});

	it.each([
		"usd",
		"US",
		"USDA",
		"U$D",
		" USD",
	])("rejects invalid currency code %s", (currencyCode) => {
		expect(() => Money.fromMinor(100, currencyCode)).toThrow(
			/three-letter uppercase ISO code/,
		);
	});

	it("adds and subtracts amounts with the same currency", () => {
		const price = Money.fromMinor(1250, "USD");
		const shipping = Money.fromMinor(499, "USD");

		expect(price.add(shipping)).toEqual(Money.fromMinor(1749, "USD"));
		expect(price.subtract(Money.fromMinor(250, "USD"))).toEqual(
			Money.fromMinor(1000, "USD"),
		);
	});

	it("rejects arithmetic across currencies", () => {
		const usd = Money.fromMinor(100, "USD");
		const eur = Money.fromMinor(100, "EUR");

		expect(() => usd.add(eur)).toThrow(/currency mismatch/);
		expect(() => usd.subtract(eur)).toThrow(/currency mismatch/);
		expect(() => usd.isGreaterThan(eur)).toThrow(/currency mismatch/);
	});

	it("multiplies by a non-negative integer quantity", () => {
		const unitPrice = Money.fromMinor(2500, "USD");

		expect(unitPrice.multiply(3)).toEqual(Money.fromMinor(7500, "USD"));
		expect(unitPrice.multiply(0)).toEqual(Money.zero("USD"));
		expect(() => unitPrice.multiply(1.5)).toThrow(/quantity/);
		expect(() => unitPrice.multiply(-1)).toThrow(/quantity/);
	});
});
