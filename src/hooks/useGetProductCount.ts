import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getProductCountByCategory } from "@/lib/tanstack-query/product.queries";
import type { CategoryMeta, ProductCountByCategoryData } from "@/types/product";
import { transformProductCategoryCount } from "@/utils/transformProductCategoryCount";

export const prroductCountByCategory = queryOptions<
	ProductCountByCategoryData[]
>({
	queryKey: ["products", "count"],
	queryFn: getProductCountByCategory,
});

const useGetProductCount = () => {
	const {
		data: rawCategoryCounts,
		isPending: loadingCategoryCounts,
		isError: isErrorCategoryCounts,
		refetch: refetchCategoryCounts,
	} = useQuery(prroductCountByCategory);

	const categoryCounts = useMemo<CategoryMeta[] | undefined>(() => {
		if (!rawCategoryCounts) return [];
		return transformProductCategoryCount(rawCategoryCounts);
	}, [rawCategoryCounts]);

	return {
		categoryCounts,
		loadingCategoryCounts,
		isErrorCategoryCounts,
		refetchCategoryCounts,
	};
};

export default useGetProductCount;
