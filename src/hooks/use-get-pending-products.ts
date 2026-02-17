import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPendingApprovalProducts } from "@/lib/tanstack-query/product-queries";
import type { BaseProduct } from "@/types/product";

export const pendingProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["pendingProducts"],
	queryFn: getPendingApprovalProducts,
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
		queryClient.invalidateQueries({ queryKey: ["pendingProducts"] });
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
