import type { ListingCategoryMeta } from "@/domains/listings/dto/listing-view";
import type { ListingCategory } from "@/types/enum";

export const listingCategoryMetadata: Record<
	ListingCategory,
	Omit<ListingCategoryMeta, "count" | "category">
> = {
	ELECTRIC: {
		label: "Electric Guitars",
		icon: "Zap",
	},
	ACOUSTIC: {
		label: "Acoustic Guitars",
		icon: "Music",
	},
	KEYBOARD: {
		label: "Keyboards & Synths",
		icon: "Piano",
	},
	PEDALS: {
		label: "Pedals & Effects",
		icon: "Wand2",
	},
	ACCESSORY: {
		label: "Accessories",
		icon: "Mic2",
	},
};
