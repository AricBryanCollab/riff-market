const currencyCodePattern = /^[A-Z]{3}$/;

export class Money {
	readonly amountCents: number;
	readonly currencyCode: string;

	private constructor(amountCents: number, currencyCode: string) {
		this.amountCents = amountCents;
		this.currencyCode = currencyCode;
	}

	static fromCents(amountCents: number, currencyCode: string): Money {
		assertValidAmountCents(amountCents);
		assertValidCurrencyCode(currencyCode);

		return new Money(amountCents, currencyCode);
	}

	static zero(currencyCode: string): Money {
		return Money.fromCents(0, currencyCode);
	}

	add(addend: Money): Money {
		this.assertSameCurrency(addend);

		return Money.fromCents(
			this.amountCents + addend.amountCents,
			this.currencyCode,
		);
	}

	subtract(subtrahend: Money): Money {
		this.assertSameCurrency(subtrahend);

		return Money.fromCents(
			this.amountCents - subtrahend.amountCents,
			this.currencyCode,
		);
	}

	multiply(quantity: number): Money {
		if (!Number.isSafeInteger(quantity) || quantity < 0) {
			throw new Error("Money quantity must be a non-negative safe integer");
		}

		return Money.fromCents(this.amountCents * quantity, this.currencyCode);
	}

	equals(other: Money): boolean {
		return (
			this.amountCents === other.amountCents &&
			this.currencyCode === other.currencyCode
		);
	}

	isGreaterThan(other: Money): boolean {
		this.assertSameCurrency(other);

		return this.amountCents > other.amountCents;
	}

	isLessThan(other: Money): boolean {
		this.assertSameCurrency(other);

		return this.amountCents < other.amountCents;
	}

	toJSON() {
		return {
			amountCents: this.amountCents,
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

function assertValidAmountCents(amountCents: number) {
	if (!Number.isSafeInteger(amountCents)) {
		throw new Error("Money amount must be integer cents within safe range");
	}

	if (amountCents < 0) {
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
