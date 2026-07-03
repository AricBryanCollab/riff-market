import { useQuery } from "@tanstack/react-query";
import { fetchRecentListings } from "@/lib/tanstack-query/listing-query-client";
import { queryKeys } from "@/lib/tanstack-query/query-keys";

const useGetRecentListings = () => {
	const {
		data: recentListings,
		isPending: isLoadingRecentListings,
		isError: isErrorRecentListings,
		refetch: refetchRecentListings,
	} = useQuery({
		queryKey: queryKeys.listings.recent,
		queryFn: async () => fetchRecentListings(8),
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
