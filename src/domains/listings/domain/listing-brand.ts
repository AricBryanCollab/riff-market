export function normalizeListingBrand(brand: string) {
	return brand.trim().replace(/\s+/g, " ");
}

export function toListingBrandKey(brand: string | null | undefined) {
	return brand ? normalizeListingBrand(brand).toLowerCase() : "";
}
