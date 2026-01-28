import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPendingApprovalProducts } from "@/lib/tanstack-query/product.queries";
import { usePendingProductStore } from "@/store/pendingproduct";

const useGetPendingProducts = () => {
	const queryClient = useQueryClient();
	const { pendingProducts, pendingProductCount, setPendingProducts } =
		usePendingProductStore();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["pendingProducts"],
		queryFn: getPendingApprovalProducts,
		staleTime: 30000,
		refetchInterval: 60000,
		retry: false,
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
