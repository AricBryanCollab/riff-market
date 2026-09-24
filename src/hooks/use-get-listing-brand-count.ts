import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingBrandCountData } from "@/domains/listings/dto/listing-view";
import { toApprovedListingSearchServerInput } from "@/hooks/use-get-listings";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getPopularListingBrandCountsServerFn } from "@/server/listing-query.functions";
import type { ApprovedListingSearchFilterQuery } from "@/utils/shop-search";

export const popularListingBrandCountsOptions = ({
	category,
	condition,
	search,
	priceMin,
	priceMax,
}: ApprovedListingSearchFilterQuery) => {
	const filters = { category, condition, search, priceMin, priceMax };

	return queryOptions<ListingBrandCountData[]>({
		queryKey: queryKeys.listings.popularBrandCounts(filters),
		queryFn: () =>
			getPopularListingBrandCountsServerFn({
				data: toApprovedListingSearchServerInput(filters),
			}),
		staleTime: 5 * 60 * 1000,
	});
};

const useGetListingBrandCount = (filters: ApprovedListingSearchFilterQuery) => {
	const {
		data: brandCounts = [],
		isPending: loadingBrandCounts,
		isError: isErrorBrandCounts,
		refetch: refetchBrandCounts,
	} = useQuery(popularListingBrandCountsOptions(filters));

	return {
		brandCounts,
		loadingBrandCounts,
		isErrorBrandCounts,
		refetchBrandCounts,
	};
};

export default useGetListingBrandCount;
