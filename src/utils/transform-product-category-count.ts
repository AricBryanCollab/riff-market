import { productCategoryMetadata } from "@/constants/product-category-metdata";
import type { ListingCategoryCountData } from "@/domains/listings/dto/listing-read-model";

export function transformProductCategoryCount(
	data: ListingCategoryCountData[],
) {
	return data.map((item) => ({
		category: item.category,
		count: item.count,
		label: productCategoryMetadata[item.category].label,
		icon: productCategoryMetadata[item.category].icon,
	}));
}
