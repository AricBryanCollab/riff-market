import type { ProductCategory } from "@/types/enum";
import type { CategoryMeta } from "@/types/product";

export const productCategoryMetadata: Record<
	ProductCategory,
	Omit<CategoryMeta, "count" | "category">
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
