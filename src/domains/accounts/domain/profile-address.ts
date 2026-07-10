const MIN_PROFILE_ADDRESS_LENGTH = 5;

export function isValidProfileAddress(address: string | null): boolean {
	if (!address) {
		return false;
	}

	return address.trim().length >= MIN_PROFILE_ADDRESS_LENGTH;
}
