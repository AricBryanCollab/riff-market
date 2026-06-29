import { listingCategoryMetadata } from "@/constants/listing-category-metadata";
import type { ListingCategoryCountData } from "@/domains/listings/dto/listing-read-model";

export function transformListingCategoryCount(
	data: ListingCategoryCountData[],
) {
	return data.map((item) => ({
		category: item.category,
		count: item.count,
		label: listingCategoryMetadata[item.category].label,
		icon: listingCategoryMetadata[item.category].icon,
	}));
}
