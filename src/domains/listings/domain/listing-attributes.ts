export const LISTING_CATEGORIES = [
	"ELECTRIC",
	"ACOUSTIC",
	"KEYBOARD",
	"PEDALS",
	"ACCESSORY",
] as const;

export const LISTING_CONDITIONS = ["NEW", "USED", "MINT"] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];
