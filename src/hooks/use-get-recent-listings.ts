import { useQuery } from "@tanstack/react-query";
import { RECENT_APPROVED_LISTINGS_LIMIT } from "@/domains/listings/application/listing-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getRecentListingsServerFn } from "@/server/listing-query.functions";

const useGetRecentListings = () => {
	const {
		data: recentListings,
		isPending: isLoadingRecentListings,
		isError: isErrorRecentListings,
		refetch: refetchRecentListings,
	} = useQuery({
		queryKey: queryKeys.listings.recent,
		queryFn: async () =>
			getRecentListingsServerFn({
				data: { limit: RECENT_APPROVED_LISTINGS_LIMIT },
			}),
		staleTime: 1000 * 60 * 5,
	});

	return {
		recentListings,
		isLoadingRecentListings,
		isErrorRecentListings,
		refetchRecentListings,
	};
};

export default useGetRecentListings;
