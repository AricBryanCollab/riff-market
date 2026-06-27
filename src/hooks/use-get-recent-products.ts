import { useQuery } from "@tanstack/react-query";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getRecentListingsProductApiFn } from "@/server/listing-read.functions";

type ProductReadError = {
	readonly error: string;
};

function unwrapProductReadResult<T>(result: T | ProductReadError): T {
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

const useGetRecentProducts = () => {
	const {
		data: recentProducts,
		isPending: isLoadingRecentProducts,
		isError: isErrorRecentProducts,
		refetch: refetchRecentProducts,
	} = useQuery({
		queryKey: queryKeys.products.recent,
		queryFn: async () => {
			const result = await getRecentListingsProductApiFn({
				data: { limit: 8 },
			});

			return unwrapProductReadResult(result) as ListingReadDto[];
		},
		staleTime: 1000 * 60 * 5,
	});

	return {
		recentProducts,
		isLoadingRecentProducts,
		isErrorRecentProducts,
		refetchRecentProducts,
	};
};

export default useGetRecentProducts;
