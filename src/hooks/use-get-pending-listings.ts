import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getPendingModerationListingsServerFn } from "@/server/listing-query.functions";

export const pendingListingsQueryOpt = queryOptions<ListingResponse[]>({
	queryKey: queryKeys.listings.pending,
	queryFn: () => getPendingModerationListingsServerFn(),
	retry: false,
	staleTime: 30000,
});

interface UseGetPendingListingsOptions {
	enabled?: boolean;
	isAdmin?: boolean;
}

const useGetPendingListings = (options: UseGetPendingListingsOptions = {}) => {
	const queryClient = useQueryClient();
	const enabled = options.enabled ?? true;
	const isAdmin = options.isAdmin ?? false;

	const {
		data,
		isLoading: isLoadingPendingListings,
		isError: isErrorPendingListings,
	} = useQuery({
		...pendingListingsQueryOpt,
		enabled: enabled && isAdmin,
	});

	const pendingListings = data ?? [];
	const pendingListingCount = pendingListings.length;

	const isEmptyPendingListings = pendingListings.length === 0;

	const refetch = () => {
		queryClient.invalidateQueries({ queryKey: queryKeys.listings.pending });
	};

	return {
		pendingListings,
		pendingListingCount,
		isLoadingPendingListings,
		isErrorPendingListings,
		isEmptyPendingListings,
		refetch,
	};
};

export default useGetPendingListings;
