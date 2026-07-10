const DIGITS_ONLY = /^\d+$/;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 12;

export function isValidPhoneNumber(phone: string | null): boolean {
	if (!phone) {
		return false;
	}

	const trimmed = phone.trim();
	if (!DIGITS_ONLY.test(trimmed)) {
		return false;
	}

	return (
		trimmed.length >= MIN_PHONE_DIGITS && trimmed.length <= MAX_PHONE_DIGITS
	);
}
