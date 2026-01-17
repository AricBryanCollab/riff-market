import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getApprovedProducts,
	getPendingApprovalProducts,
} from "@/lib/tanstack-query/product.queries";
import type { BaseProduct } from "@/types/product";

export const productsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["products"],
	queryFn: getApprovedProducts,
});

export const pendingProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["pendingProducts"],
	queryFn: getPendingApprovalProducts,
	retry: false,
});

const useGetProducts = () => {
	const [showPending, setShowPending] = useState<boolean>(false);

	const {
		data: productList,
		isPending: loadingProductList,
		isError: isErrorProductList,
		refetch: refetchProductList,
	} = useQuery(productsQueryOpt);

	const {
		data: pendingProductList,
		isPending: loadingPendingProduct,
		isError: isErrorPendingProduct,
	} = useQuery({ ...pendingProductsQueryOpt, enabled: showPending });

	return {
		productList,
		loadingProductList,
		isErrorProductList,
		showPending,
		pendingProductList,
		loadingPendingProduct,
		isErrorPendingProduct,
		setShowPending,
		refetchProductList,
	};
};

export default useGetProducts;
