export const DEFAULT_LISTING_CURRENCY_CODE = "USD";

export type ListingMoneyPersistence = {
	priceAmountMinor: number;
	currencyCode: string;
};

export type ListingMoneySource = {
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

const decimalPricePattern = /^(\d+)(?:\.(\d+))?$/;

export function parseListingPriceInputToAmountMinor(
	price: string | number,
): number {
	const value = normalizePriceInput(price);

	return decimalPriceStringToAmountMinor(value, 2);
}

export function parseOptionalListingPriceInputToAmountMinor(
	price: string | null | undefined,
): number | undefined {
	if (price === undefined || price === null || price.trim() === "") {
		return undefined;
	}

	return parseListingPriceInputToAmountMinor(price);
}

export function priceAmountMinorToDecimalPrice(
	priceAmountMinor: number,
): number {
	assertSafeNonNegativeInteger(priceAmountMinor, "Listing price minor amount");

	return priceAmountMinor / 100;
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

export function normalizeListingMoney<T extends ListingMoneySource>(
	listing: T,
): Omit<T, "price" | "priceAmountMinor" | "priceCents" | "currencyCode"> & {
	price: number;
	priceAmountMinor: number;
	priceCents: number;
	currencyCode: string;
} {
	return {
		...listing,
		price: priceAmountMinorToDecimalPrice(listing.priceAmountMinor),
		priceCents: listing.priceAmountMinor,
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
		throw new Error("Listing price must use at most two decimal places");
	}

	const wholeUnitMinorAmount = wholeUnits * 100;
	const minorAmountFromFraction = Number(fraction.slice(0, 2).padEnd(2, "0"));
	const shouldRound = Number(fraction[2] ?? "0") >= 5;
	const priceAmountMinor =
		wholeUnitMinorAmount + minorAmountFromFraction + (shouldRound ? 1 : 0);

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
