import { productCategoryMetadata } from "@/constants/productCategoryMetdata";
import type { ProductCountByCategoryData } from "@/types/product";

export function transformProductCategoryCount(
	data: ProductCountByCategoryData[],
) {
	return data.map((item) => ({
		category: item.category,
		count: item.count,
		label: productCategoryMetadata[item.category].label,
		icon: productCategoryMetadata[item.category].icon,
	}));
}
