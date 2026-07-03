import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingBrandCountData } from "@/domains/listings/dto/listing-view";
import { fetchPopularListingBrandCounts } from "@/lib/tanstack-query/listing-query-client";
import { queryKeys } from "@/lib/tanstack-query/query-keys";

export const popularListingBrandCountsOptions = queryOptions<
	ListingBrandCountData[]
>({
	queryKey: queryKeys.listings.popularBrandCounts,
	queryFn: fetchPopularListingBrandCounts,
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
