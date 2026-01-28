import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPendingApprovalProducts } from "@/lib/tanstack-query/product.queries";
import { usePendingProductStore } from "@/store/pendingproduct";
import type { BaseProduct } from "@/types/product";

export const pendingProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["pendingProducts"],
	queryFn: getPendingApprovalProducts,
	retry: false,
});

const useGetPendingProducts = (enabled: boolean = false) => {
	const queryClient = useQueryClient();
	const { pendingProducts, pendingProductCount, setPendingProducts } =
		usePendingProductStore();

	const { data, isLoading, isError } = useQuery({
		...pendingProductsQueryOpt,
		enabled,
	});

	useEffect(() => {
		if (data) {
			setPendingProducts(data);
		}
	}, [data, setPendingProducts]);

	const isEmptyPendingProducts = pendingProducts.length === 0;

	const refetch = () => {
		queryClient.invalidateQueries({ queryKey: ["pendingProducts"] });
	};

	return {
		pendingProducts,
		pendingProductCount,
		isLoading,
		isError,
		isEmptyPendingProducts,
		refetch,
	};
};

export default useGetPendingProducts;
