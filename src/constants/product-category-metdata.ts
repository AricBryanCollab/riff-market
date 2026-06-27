import type { ListingCategoryMeta } from "@/domains/listings/dto/listing-read-model";
import type { ProductCategory } from "@/types/enum";

export const productCategoryMetadata: Record<
	ProductCategory,
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
