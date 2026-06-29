import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getPendingModerationListingsProductApiFn as getPendingModerationListingsCompatibilityFn } from "@/server/listing-read.functions";

type ListingReadError = {
	readonly error: string;
};

function unwrapListingReadResult<T>(result: T | ListingReadError): T {
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

export const pendingListingsQueryOpt = queryOptions<ListingReadDto[]>({
	queryKey: queryKeys.products.pending,
	queryFn: async () => {
		const result = await getPendingModerationListingsCompatibilityFn();

		return unwrapListingReadResult(result) as ListingReadDto[];
	},
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
		queryClient.invalidateQueries({ queryKey: queryKeys.products.pending });
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
