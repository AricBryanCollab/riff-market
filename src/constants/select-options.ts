import {
	LISTING_CATEGORIES,
	LISTING_CONDITIONS,
	type ListingCategory,
	type ListingCondition,
} from "@/domains/listings/domain/listing-attributes";

export const roleOptions = [
	{ value: "SELLER", label: "Seller" },
	{ value: "CUSTOMER", label: "Customer" },
] as const;

const listingCategoryLabels: Record<ListingCategory, string> = {
	ELECTRIC: "Electric Guitar",
	ACOUSTIC: "Acoustic Guitar",
	KEYBOARD: "Keyboard/Piano",
	PEDALS: "Pedals & Effects",
	ACCESSORY: "Accessories",
};

const listingConditionLabels: Record<ListingCondition, string> = {
	NEW: "Brand New",
	USED: "Used",
	MINT: "Mint Condition",
};

export const listingCategoryOptions = LISTING_CATEGORIES.map((value) => ({
	value,
	label: listingCategoryLabels[value],
}));

export const listingConditionOptions = LISTING_CONDITIONS.map((value) => ({
	value,
	label: listingConditionLabels[value],
}));

export const chatRoleOptions = [
	{ value: "USER", label: "User" },
	{ value: "ASSISTANT", label: "Assistant" },
] as const;

export const themeOptions = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;
