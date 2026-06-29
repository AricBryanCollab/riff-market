export const DEFAULT_LISTING_CURRENCY_CODE = "USD";

export type ListingMoneyPersistence = {
	price: number;
	priceCents: number;
	currencyCode: string;
};

export type ListingMoneySource = {
	price: number;
	priceCents?: number | null;
	currencyCode?: string | null;
};

type ListingPriceRangeInput = {
	priceMinCents?: number;
	priceMaxCents?: number;
};

type ListingPriceRangePersistence = {
	priceCents: {
		gte?: number;
		lte?: number;
	};
	legacyPrice: {
		gte?: number;
		lte?: number;
	};
};

const decimalPricePattern = /^(\d+)(?:\.(\d+))?$/;

export function parseListingPriceInputToCents(price: string | number): number {
	const value = normalizePriceInput(price);

	return decimalPriceStringToCents(value, 2);
}

export function parseOptionalListingPriceInputToCents(
	price: string | null | undefined,
): number | undefined {
	if (price === undefined || price === null || price.trim() === "") {
		return undefined;
	}

	return parseListingPriceInputToCents(price);
}

export function legacyFloatPriceToCents(price: number): number {
	assertFiniteNonNegativeNumber(price);

	return decimalPriceStringToCents(String(price));
}

export function priceCentsToDecimalPrice(priceCents: number): number {
	assertSafeNonNegativeInteger(priceCents, "Listing price cents");

	return priceCents / 100;
}

export function toListingMoneyPersistence(
	price: string | number,
): ListingMoneyPersistence {
	const priceCents = parseListingPriceInputToCents(price);

	return {
		price: priceCentsToDecimalPrice(priceCents),
		priceCents,
		currencyCode: DEFAULT_LISTING_CURRENCY_CODE,
	};
}

export function normalizeListingMoney<T extends ListingMoneySource>(
	listing: T,
): Omit<T, "price" | "priceCents" | "currencyCode"> & {
	price: number;
	priceCents: number;
	currencyCode: string;
} {
	const priceCents =
		listing.priceCents ?? legacyFloatPriceToCents(listing.price);

	return {
		...listing,
		price: priceCentsToDecimalPrice(priceCents),
		priceCents,
		currencyCode: listing.currencyCode ?? DEFAULT_LISTING_CURRENCY_CODE,
	};
}

export function toListingPriceRangePersistence({
	priceMinCents,
	priceMaxCents,
}: ListingPriceRangeInput): ListingPriceRangePersistence | undefined {
	if (priceMinCents === undefined && priceMaxCents === undefined) {
		return undefined;
	}

	if (priceMinCents !== undefined) {
		assertSafeNonNegativeInteger(priceMinCents, "Minimum listing price cents");
	}

	if (priceMaxCents !== undefined) {
		assertSafeNonNegativeInteger(priceMaxCents, "Maximum listing price cents");
	}

	return {
		priceCents: {
			...(priceMinCents !== undefined && { gte: priceMinCents }),
			...(priceMaxCents !== undefined && { lte: priceMaxCents }),
		},
		legacyPrice: {
			...(priceMinCents !== undefined && {
				gte: priceCentsToDecimalPrice(priceMinCents),
			}),
			...(priceMaxCents !== undefined && {
				lte: priceCentsToDecimalPrice(priceMaxCents),
			}),
		},
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

function decimalPriceStringToCents(
	value: string,
	maxFractionDigits?: number,
): number {
	const match = decimalPricePattern.exec(value);

	if (!match) {
		throw new Error("Listing price must be a non-negative decimal amount");
	}

	const dollars = Number(match[1]);
	const fraction = match[2] ?? "";

	if (maxFractionDigits !== undefined && fraction.length > maxFractionDigits) {
		throw new Error("Listing price must use at most two decimal places");
	}

	const dollarCents = dollars * 100;
	const centsFromFraction = Number(fraction.slice(0, 2).padEnd(2, "0"));
	const shouldRound = Number(fraction[2] ?? "0") >= 5;
	const priceCents = dollarCents + centsFromFraction + (shouldRound ? 1 : 0);

	assertSafeNonNegativeInteger(priceCents, "Listing price cents");

	return priceCents;
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
