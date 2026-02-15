import { queryOptions, useQuery } from "@tanstack/react-query";
import { getProductCountByCategory } from "@/lib/tanstack-query/product.queries";
import type { ProductCountByCategoryData } from "@/types/product";
import { transformProductCategoryCount } from "@/utils/transform-product-category-count";

export const productCountByCategoryOptions = queryOptions({
	queryKey: ["products", "count", "by-category"],
	queryFn: getProductCountByCategory,
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
