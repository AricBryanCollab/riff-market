import { getCurrencyPolicy } from "@/domains/shared/domain/currency";

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatMoneyAmountMinor(
	amountMinor: number,
	currencyCode: string,
	locale = "en-US",
) {
	const fractionDigits = getMoneyFractionDigits(currencyCode, locale);

	return getCurrencyFormatter(locale, currencyCode, fractionDigits).format(
		moneyAmountMinorToDecimal(amountMinor, currencyCode, locale),
	);
}

export function moneyAmountMinorToDecimal(
	amountMinor: number,
	currencyCode: string,
	locale = "en-US",
) {
	assertSafeNonNegativeInteger(amountMinor);

	const fractionDigits = getMoneyFractionDigits(currencyCode, locale);

	return amountMinor / 10 ** (fractionDigits ?? 2);
}

function getCurrencyFormatter(
	locale: string,
	currencyCode: string,
	fractionDigits?: number,
) {
	// Intl.NumberFormat construction is relatively expensive in price-heavy UI.
	// Key every formatting input so reused instances stay locale/currency safe.
	const cacheKey = `${locale}:${currencyCode}:${fractionDigits ?? "default"}`;
	const cached = currencyFormatterCache.get(cacheKey);

	if (cached) {
		return cached;
	}

	const formatter = new Intl.NumberFormat(locale, {
		style: "currency",
		currency: currencyCode,
		...(fractionDigits !== undefined && {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}),
	});
	currencyFormatterCache.set(cacheKey, formatter);

	return formatter;
}

function getMoneyFractionDigits(currencyCode: string, locale: string) {
	const configured = getCurrencyPolicy(currencyCode)?.minorUnitDigits;

	if (configured !== undefined) {
		return configured;
	}

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: currencyCode,
	}).resolvedOptions().maximumFractionDigits;
}

function assertSafeNonNegativeInteger(value: number) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error("Money amount must be a non-negative safe integer");
	}
}
