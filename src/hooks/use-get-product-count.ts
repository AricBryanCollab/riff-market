import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getListingCategoryCountsProductApiFn } from "@/server/listing-read.functions";
import type { ProductCountByCategoryData } from "@/types/product";
import { transformProductCategoryCount } from "@/utils/transform-product-category-count";

type ProductReadError = {
	readonly error: string;
};

function unwrapProductReadResult<T>(result: T | ProductReadError): T {
	if (
		typeof result === "object" &&
		result !== null &&
		"error" in result &&
		typeof result.error === "string"
	) {
		throw new Error(result.error);
	}

	return result as T;
}

export const productCountByCategoryOptions = queryOptions({
	queryKey: queryKeys.products.countByCategory,
	queryFn: async () => {
		const result = await getListingCategoryCountsProductApiFn();

		return unwrapProductReadResult(result) as ProductCountByCategoryData[];
	},
	select: (data: ProductCountByCategoryData[]) =>
		transformProductCategoryCount(data),
	staleTime: 5 * 60 * 1000,
});

const useGetProductCount = () => {
	const {
		data: categoryCounts = [],
		isPending: loadingCategoryCounts,
		isError: isErrorCategoryCounts,
		refetch: refetchCategoryCounts,
	} = useQuery(productCountByCategoryOptions);

	return {
		categoryCounts,
		loadingCategoryCounts,
		isErrorCategoryCounts,
		refetchCategoryCounts,
	};
};

export default useGetProductCount;
