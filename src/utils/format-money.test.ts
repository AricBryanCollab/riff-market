import { describe, expect, it } from "vitest";
import {
	formatMoneyAmountMinor,
	moneyAmountMinorToDecimal,
} from "./format-money";

describe("formatMoneyAmountMinor", () => {
	it("formats minor amounts with the currency decimal precision", () => {
		expect(formatMoneyAmountMinor(19995, "USD")).toBe("$199.95");
		expect(formatMoneyAmountMinor(19995, "USD", "en-US")).toBe("$199.95");
	});

	it("formats TWD marketplace amounts as whole dollars", () => {
		expect(moneyAmountMinorToDecimal(19995, "TWD")).toBe(19995);
		expect(formatMoneyAmountMinor(19995, "TWD")).toBe("NT$19,995");
	});

	it("converts zero-decimal currency minor amounts without cents", () => {
		expect(moneyAmountMinorToDecimal(1234, "JPY")).toBe(1234);
		expect(formatMoneyAmountMinor(1234, "JPY")).toBe("¥1,234");
	});
});
