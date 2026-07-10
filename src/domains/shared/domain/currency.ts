// This is marketplace policy, not deploy-time config. Changing it affects
// listing validation, Prisma defaults, and persisted price semantics.
export const MARKETPLACE_CURRENCY_CODE = "TWD";

export type CurrencyPolicy = {
	readonly minorUnitDigits: number;
};

const currencyPolicies: Record<string, CurrencyPolicy> = {
	TWD: {
		minorUnitDigits: 0,
	},
};

export function getCurrencyPolicy(
	currencyCode: string,
): CurrencyPolicy | undefined {
	return currencyPolicies[currencyCode];
}

export function requireCurrencyPolicy(currencyCode: string): CurrencyPolicy {
	const policy = getCurrencyPolicy(currencyCode);

	if (!policy) {
		throw new Error(`Missing currency policy for ${currencyCode}`);
	}

	return policy;
}
