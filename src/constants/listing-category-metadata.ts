import type { ListingCategoryMeta } from "@/domains/listings/dto/listing-view";
import type { ListingCategory } from "@/types/enum";

export const listingCategoryMetadata: Record<
	ListingCategory,
	Omit<ListingCategoryMeta, "count" | "category">
> = {
	ELECTRIC: {
		label: "Electric Guitars",
		icon: "PlugZap",
	},
	ACOUSTIC: {
		label: "Acoustic Guitars",
		icon: "Guitar",
	},
	KEYBOARD: {
		label: "Keyboards & Synths",
		icon: "KeyboardMusic",
	},
	PEDALS: {
		label: "Pedals & Effects",
		icon: "AudioWaveform",
	},
	ACCESSORY: {
		label: "Accessories",
		icon: "Headphones",
	},
};
