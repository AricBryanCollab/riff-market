export function validatePhoneNumber(phone: string | null) {
	if (!phone || phone.trim() === "") {
		return true;
	}

	const cleaned = phone.trim();
	const digitsOnly = /^\d+$/;
	if (!digitsOnly.test(cleaned)) {
		return false;
	}

	const length = cleaned.length;
	return length >= 10 && length <= 12;
}
