import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getPendingModerationListingsProductApiFn } from "@/server/listing-read.functions";
import type { BaseProduct } from "@/types/product";

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

export const pendingProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: queryKeys.products.pending,
	queryFn: async () => {
		const result = await getPendingModerationListingsProductApiFn();

		return unwrapProductReadResult(result) as BaseProduct[];
	},
	retry: false,
	staleTime: 30000,
});

interface UseGetPendingProductsOptions {
	enabled?: boolean;
	isAdmin?: boolean;
}

const useGetPendingProducts = (options: UseGetPendingProductsOptions = {}) => {
	const queryClient = useQueryClient();
	const enabled = options.enabled ?? true;
	const isAdmin = options.isAdmin ?? false;

	const {
		data,
		isLoading: isLoadingPendingProducts,
		isError: isErrorPendingProducts,
	} = useQuery({
		...pendingProductsQueryOpt,
		enabled: enabled && isAdmin,
	});

	const pendingProducts = data ?? [];
	const pendingProductCount = pendingProducts.length;

	const isEmptyPendingProducts = pendingProducts.length === 0;

	const refetch = () => {
		queryClient.invalidateQueries({ queryKey: queryKeys.products.pending });
	};

	return {
		pendingProducts,
		pendingProductCount,
		isLoadingPendingProducts,
		isErrorPendingProducts,
		isEmptyPendingProducts,
		refetch,
	};
};

export default useGetPendingProducts;
