import { useQuery } from "@tanstack/react-query";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getRecentListingsProductApiFn as getRecentListingsCompatibilityFn } from "@/server/listing-read.functions";

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

const useGetRecentListings = () => {
	const {
		data: recentListings,
		isPending: isLoadingRecentListings,
		isError: isErrorRecentListings,
		refetch: refetchRecentListings,
	} = useQuery({
		queryKey: queryKeys.products.recent,
		queryFn: async () => {
			const result = await getRecentListingsCompatibilityFn({
				data: { limit: 8 },
			});

			return unwrapListingReadResult(result) as ListingReadDto[];
		},
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
