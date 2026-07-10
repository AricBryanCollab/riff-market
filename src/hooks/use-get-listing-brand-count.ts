import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingBrandCountData } from "@/domains/listings/dto/listing-view";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getPopularListingBrandCountsServerFn } from "@/server/listing-query.functions";

export const popularListingBrandCountsOptions = queryOptions<
	ListingBrandCountData[]
>({
	queryKey: queryKeys.listings.popularBrandCounts,
	queryFn: () => getPopularListingBrandCountsServerFn(),
	staleTime: 5 * 60 * 1000,
});

const useGetListingBrandCount = () => {
	const {
		data: brandCounts = [],
		isPending: loadingBrandCounts,
		isError: isErrorBrandCounts,
		refetch: refetchBrandCounts,
	} = useQuery(popularListingBrandCountsOptions);

	return {
		brandCounts,
		loadingBrandCounts,
		isErrorBrandCounts,
		refetchBrandCounts,
	};
};

export default useGetListingBrandCount;
