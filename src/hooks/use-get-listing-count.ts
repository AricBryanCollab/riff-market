import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingCategoryCountData } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getListingCategoryCountsProductApiFn as getListingCategoryCountsCompatibilityFn } from "@/server/listing-read.functions";
import { transformListingCategoryCount } from "@/utils/transform-listing-category-count";

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

export const listingCountByCategoryOptions = queryOptions({
	queryKey: queryKeys.products.countByCategory,
	queryFn: async () => {
		const result = await getListingCategoryCountsCompatibilityFn();

		return unwrapListingReadResult(result) as ListingCategoryCountData[];
	},
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
