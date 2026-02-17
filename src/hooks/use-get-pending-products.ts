import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/use-auth-user";
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
}

const useGetPendingProducts = (options: UseGetPendingProductsOptions = {}) => {
	const queryClient = useQueryClient();
	const { data: user } = useAuthUser();
	const userRole = user?.role;
	const enabled = options.enabled ?? true;

	const {
		data,
		isLoading: isLoadingPendingProducts,
		isError: isErrorPendingProducts,
	} = useQuery({
		...pendingProductsQueryOpt,
		enabled: enabled && userRole === "ADMIN",
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
