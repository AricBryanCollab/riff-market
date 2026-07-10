import {
	MARKETPLACE_CURRENCY_CODE,
	requireCurrencyPolicy,
} from "@/domains/shared/domain/currency";
import { Money } from "@/domains/shared/domain/money";
import type { AppError } from "@/domains/shared/domain/result";

export const DEFAULT_LISTING_CURRENCY_CODE = MARKETPLACE_CURRENCY_CODE;

export type ListingMoneyPersistence = {
	priceAmountMinor: number;
	currencyCode: string;
};

type ListingPriceRangeInput = {
	priceMinAmountMinor?: number;
	priceMaxAmountMinor?: number;
};

type ListingPriceRangePersistence = {
	gte?: number;
	lte?: number;
};

export type ListingCartSubtotalLine = {
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly quantity: number;
};

export type ListingCartSubtotalError =
	AppError<"LISTING_CART_SUBTOTAL_INVALID_MONEY">;

export type ListingCartSubtotalResult =
	| {
			readonly status: "valid";
			readonly subtotal: Money;
	  }
	| {
			readonly status: "invalid";
			readonly subtotal: Money;
			readonly error: ListingCartSubtotalError;
	  };

const decimalPricePattern = /^(\d+)(?:\.(\d+))?$/;
const listingPriceMinorUnitDigits = requireCurrencyPolicy(
	DEFAULT_LISTING_CURRENCY_CODE,
).minorUnitDigits;

export function parseListingPriceInputToAmountMinor(
	price: string | number,
): number {
	const value = normalizePriceInput(price);

	return decimalPriceStringToAmountMinor(value, listingPriceMinorUnitDigits);
}

export function parseOptionalListingPriceInputToAmountMinor(
	price: string | null | undefined,
): number | undefined {
	const value = normalizeOptionalListingPriceInput(price);

	if (value === undefined) {
		return undefined;
	}

	return decimalPriceStringToAmountMinor(value, listingPriceMinorUnitDigits);
}

export function normalizeOptionalListingPriceInput(
	price: unknown,
): string | undefined {
	if (price === undefined || price === null) {
		return undefined;
	}

	const value = String(price).trim();

	if (value.length === 0) {
		return undefined;
	}

	decimalPriceStringToAmountMinor(value, listingPriceMinorUnitDigits);

	return value;
}

export function priceAmountMinorToDecimalPrice(
	priceAmountMinor: number,
): number {
	assertSafeNonNegativeInteger(priceAmountMinor, "Listing price minor amount");

	return priceAmountMinor / 10 ** listingPriceMinorUnitDigits;
}

export function toListingMoneyPersistence(
	price: string | number,
): ListingMoneyPersistence {
	const priceAmountMinor = parseListingPriceInputToAmountMinor(price);

	return {
		priceAmountMinor,
		currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
	};
}

export function toListingPriceRangePersistence({
	priceMinAmountMinor,
	priceMaxAmountMinor,
}: ListingPriceRangeInput): ListingPriceRangePersistence | undefined {
	if (priceMinAmountMinor === undefined && priceMaxAmountMinor === undefined) {
		return undefined;
	}

	if (priceMinAmountMinor !== undefined) {
		assertSafeNonNegativeInteger(
			priceMinAmountMinor,
			"Minimum listing price minor amount",
		);
	}

	if (priceMaxAmountMinor !== undefined) {
		assertSafeNonNegativeInteger(
			priceMaxAmountMinor,
			"Maximum listing price minor amount",
		);
	}

	return {
		...(priceMinAmountMinor !== undefined && { gte: priceMinAmountMinor }),
		...(priceMaxAmountMinor !== undefined && { lte: priceMaxAmountMinor }),
	};
}

export function calculateListingCartSubtotal(
	lines: ListingCartSubtotalLine[],
): ListingCartSubtotalResult {
	try {
		let subtotal: Money | undefined;

		for (const line of lines) {
			const lineSubtotal = Money.fromMinor(
				line.priceAmountMinor,
				line.currencyCode,
			).multiply(line.quantity);

			subtotal = subtotal ? subtotal.add(lineSubtotal) : lineSubtotal;
		}

		return {
			status: "valid",
			subtotal: subtotal ?? Money.zero(DEFAULT_LISTING_CURRENCY_CODE),
		};
	} catch (error) {
		return {
			status: "invalid",
			subtotal: Money.zero(DEFAULT_LISTING_CURRENCY_CODE),
			error: listingCartSubtotalError(error),
		};
	}
}

function normalizePriceInput(price: string | number): string {
	if (typeof price === "number") {
		assertFiniteNonNegativeNumber(price);
		return String(price);
	}

	const value = price.trim();

	if (value.length === 0) {
		throw new Error("Listing price is required");
	}

	return value;
}

function decimalPriceStringToAmountMinor(
	value: string,
	maxFractionDigits?: number,
): number {
	const match = decimalPricePattern.exec(value);

	if (!match) {
		throw new Error("Listing price must be a non-negative decimal amount");
	}

	const wholeUnits = Number(match[1]);
	const fraction = match[2] ?? "";

	if (maxFractionDigits !== undefined && fraction.length > maxFractionDigits) {
		throw new Error(listingPriceFractionDigitsMessage(maxFractionDigits));
	}

	const fractionDigits = maxFractionDigits ?? 2;
	const minorUnitScale = 10 ** fractionDigits;
	const wholeUnitMinorAmount = wholeUnits * minorUnitScale;
	const minorAmountFromFraction = Number(
		fraction.slice(0, fractionDigits).padEnd(fractionDigits, "0"),
	);
	const priceAmountMinor = wholeUnitMinorAmount + minorAmountFromFraction;

	assertSafeNonNegativeInteger(priceAmountMinor, "Listing price minor amount");

	return priceAmountMinor;
}

function assertFiniteNonNegativeNumber(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		throw new Error("Listing price must be a non-negative finite number");
	}
}

function assertSafeNonNegativeInteger(value: number, label: string) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${label} must be a non-negative safe integer`);
	}
}

function listingPriceFractionDigitsMessage(maxFractionDigits: number) {
	if (maxFractionDigits === 0) {
		return `Listing price must use whole ${DEFAULT_LISTING_CURRENCY_CODE} amounts`;
	}

	return `Listing price must use at most ${maxFractionDigits} decimal places`;
}

function listingCartSubtotalError(error: unknown): ListingCartSubtotalError {
	return {
		code: "LISTING_CART_SUBTOTAL_INVALID_MONEY",
		message:
			error instanceof Error &&
			error.message.startsWith("Money currency mismatch:")
				? "Cart subtotal requires listings in a single currency"
				: error instanceof Error
					? error.message
					: "Cart subtotal could not be calculated",
		kind: "invariant",
	};
}
