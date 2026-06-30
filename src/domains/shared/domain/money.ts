const currencyCodePattern = /^[A-Z]{3}$/;

export class Money {
	readonly amountMinor: number;
	readonly currencyCode: string;

	private constructor(amountMinor: number, currencyCode: string) {
		this.amountMinor = amountMinor;
		this.currencyCode = currencyCode;
	}

	static fromMinor(amountMinor: number, currencyCode: string): Money {
		assertValidAmountMinor(amountMinor);
		assertValidCurrencyCode(currencyCode);

		return new Money(amountMinor, currencyCode);
	}

	static fromCents(amountCents: number, currencyCode: string): Money {
		return Money.fromMinor(amountCents, currencyCode);
	}

	static zero(currencyCode: string): Money {
		return Money.fromMinor(0, currencyCode);
	}

	add(addend: Money): Money {
		this.assertSameCurrency(addend);

		return Money.fromMinor(
			this.amountMinor + addend.amountMinor,
			this.currencyCode,
		);
	}

	subtract(subtrahend: Money): Money {
		this.assertSameCurrency(subtrahend);

		return Money.fromMinor(
			this.amountMinor - subtrahend.amountMinor,
			this.currencyCode,
		);
	}

	multiply(quantity: number): Money {
		if (!Number.isSafeInteger(quantity) || quantity < 0) {
			throw new Error("Money quantity must be a non-negative safe integer");
		}

		return Money.fromMinor(this.amountMinor * quantity, this.currencyCode);
	}

	equals(other: Money): boolean {
		return (
			this.amountMinor === other.amountMinor &&
			this.currencyCode === other.currencyCode
		);
	}

	isGreaterThan(other: Money): boolean {
		this.assertSameCurrency(other);

		return this.amountMinor > other.amountMinor;
	}

	isLessThan(other: Money): boolean {
		this.assertSameCurrency(other);

		return this.amountMinor < other.amountMinor;
	}

	get amountCents() {
		return this.amountMinor;
	}

	toJSON() {
		return {
			amountMinor: this.amountMinor,
			currencyCode: this.currencyCode,
		};
	}

	private assertSameCurrency(other: Money) {
		if (this.currencyCode !== other.currencyCode) {
			throw new Error(
				`Money currency mismatch: ${this.currencyCode} cannot be combined with ${other.currencyCode}`,
			);
		}
	}
}

function assertValidAmountMinor(amountMinor: number) {
	if (!Number.isSafeInteger(amountMinor)) {
		throw new Error(
			"Money amount must be integer minor units within safe range",
		);
	}

	if (amountMinor < 0) {
		throw new Error("Money amount cannot be negative");
	}
}

function assertValidCurrencyCode(currencyCode: string) {
	if (!currencyCodePattern.test(currencyCode)) {
		throw new Error(
			"Money currency code must be a three-letter uppercase ISO code",
		);
	}
}
