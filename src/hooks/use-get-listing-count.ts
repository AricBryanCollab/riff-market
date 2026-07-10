import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingCategoryCountData } from "@/domains/listings/dto/listing-view";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getListingCategoryCountsServerFn } from "@/server/listing-query.functions";
import { transformListingCategoryCount } from "@/utils/transform-listing-category-count";

export const listingCountByCategoryOptions = queryOptions({
	queryKey: queryKeys.listings.countByCategory,
	queryFn: () => getListingCategoryCountsServerFn(),
	select: (data: ListingCategoryCountData[]) =>
		transformListingCategoryCount(data),
	staleTime: 5 * 60 * 1000,
});

const useGetListingCount = () => {
	const {
		data: categoryCounts = [],
		isPending: loadingCategoryCounts,
		isError: isErrorCategoryCounts,
		refetch: refetchCategoryCounts,
	} = useQuery(listingCountByCategoryOptions);

	return {
		categoryCounts,
		loadingCategoryCounts,
		isErrorCategoryCounts,
		refetchCategoryCounts,
	};
};

export default useGetListingCount;
