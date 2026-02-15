import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPendingApprovalProducts } from "@/lib/tanstack-query/product.queries";
import { usePendingProductStore } from "@/store/pending-product";
import { useUserStore } from "@/store/user";
import type { BaseProduct } from "@/types/product";

const pendingProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["pendingProducts"],
	queryFn: getPendingApprovalProducts,
	retry: false,
});

const useGetPendingProducts = () => {
	const queryClient = useQueryClient();
	const { pendingProducts, pendingProductCount, setPendingProducts } =
		usePendingProductStore();
	const userRole = useUserStore().user?.role;

	const {
		data,
		isLoading: isLoadingPendingProducts,
		isError: isErrorPendingProducts,
	} = useQuery({ ...pendingProductsQueryOpt, enabled: userRole === "ADMIN" });

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
		isLoadingPendingProducts,
		isErrorPendingProducts,
		isEmptyPendingProducts,
		refetch,
	};
};

export default useGetPendingProducts;
