export const DEFAULT_PRODUCT_CURRENCY_CODE = "USD";

export type ProductMoneyPersistence = {
	price: number;
	priceCents: number;
	currencyCode: string;
};

export type ProductMoneySource = {
	price: number;
	priceCents?: number | null;
	currencyCode?: string | null;
};

type ProductPriceRangeInput = {
	priceMinCents?: number;
	priceMaxCents?: number;
};

type ProductPriceRangePersistence = {
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

export function parseProductPriceInputToCents(price: string | number): number {
	const value = normalizePriceInput(price);

	return decimalPriceStringToCents(value, 2);
}

export function parseOptionalProductPriceInputToCents(
	price: string | null | undefined,
): number | undefined {
	if (price === undefined || price === null || price.trim() === "") {
		return undefined;
	}

	return parseProductPriceInputToCents(price);
}

export function legacyFloatPriceToCents(price: number): number {
	assertFiniteNonNegativeNumber(price);

	return decimalPriceStringToCents(String(price));
}

export function priceCentsToDecimalPrice(priceCents: number): number {
	assertSafeNonNegativeInteger(priceCents, "Product price cents");

	return priceCents / 100;
}

export function toProductMoneyPersistence(
	price: string | number,
): ProductMoneyPersistence {
	const priceCents = parseProductPriceInputToCents(price);

	return {
		price: priceCentsToDecimalPrice(priceCents),
		priceCents,
		currencyCode: DEFAULT_PRODUCT_CURRENCY_CODE,
	};
}

export function normalizeProductMoney<T extends ProductMoneySource>(
	product: T,
): Omit<T, "price" | "priceCents" | "currencyCode"> & {
	price: number;
	priceCents: number;
	currencyCode: string;
} {
	const priceCents =
		product.priceCents ?? legacyFloatPriceToCents(product.price);

	return {
		...product,
		price: priceCentsToDecimalPrice(priceCents),
		priceCents,
		currencyCode: product.currencyCode ?? DEFAULT_PRODUCT_CURRENCY_CODE,
	};
}

export function toProductPriceRangePersistence({
	priceMinCents,
	priceMaxCents,
}: ProductPriceRangeInput): ProductPriceRangePersistence | undefined {
	if (priceMinCents === undefined && priceMaxCents === undefined) {
		return undefined;
	}

	if (priceMinCents !== undefined) {
		assertSafeNonNegativeInteger(priceMinCents, "Minimum product price cents");
	}

	if (priceMaxCents !== undefined) {
		assertSafeNonNegativeInteger(priceMaxCents, "Maximum product price cents");
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
		throw new Error("Product price is required");
	}

	return value;
}

function decimalPriceStringToCents(
	value: string,
	maxFractionDigits?: number,
): number {
	const match = decimalPricePattern.exec(value);

	if (!match) {
		throw new Error("Product price must be a non-negative decimal amount");
	}

	const dollars = Number(match[1]);
	const fraction = match[2] ?? "";

	if (maxFractionDigits !== undefined && fraction.length > maxFractionDigits) {
		throw new Error("Product price must use at most two decimal places");
	}

	const dollarCents = dollars * 100;
	const centsFromFraction = Number(fraction.slice(0, 2).padEnd(2, "0"));
	const shouldRound = Number(fraction[2] ?? "0") >= 5;
	const priceCents = dollarCents + centsFromFraction + (shouldRound ? 1 : 0);

	assertSafeNonNegativeInteger(priceCents, "Product price cents");

	return priceCents;
}

function assertFiniteNonNegativeNumber(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		throw new Error("Product price must be a non-negative finite number");
	}
}

function assertSafeNonNegativeInteger(value: number, label: string) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${label} must be a non-negative safe integer`);
	}
}
