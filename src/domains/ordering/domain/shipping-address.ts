const MIN_SHIPPING_ADDRESS_LENGTH = 5;

export function isValidShippingAddress(address: string | null): boolean {
	if (!address) {
		return false;
	}

	return address.trim().length >= MIN_SHIPPING_ADDRESS_LENGTH;
}
