import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getApprovedProducts,
	getPendingApprovalProducts,
	getProductDetailsById,
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

export const productbyIdQueryOpt = (id: string) =>
	queryOptions<BaseProduct>({
		queryKey: ["product"],
		queryFn: () => getProductDetailsById(id),
		retry: false,
	});

const useGetProducts = () => {
	const [showPending, setShowPending] = useState<boolean>(false);
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);

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

	const {
		data: product,
		isPending: loadingProduct,
		isError: isErrorProduct,
		refetch: refetchProductDetails,
	} = useQuery({
		...productbyIdQueryOpt(selectedProductId ?? ""),
		enabled: !!selectedProductId,
	});

	return {
		productList,
		loadingProductList,
		isErrorProductList,
		showPending,
		pendingProductList,
		loadingPendingProduct,
		isErrorPendingProduct,
		product,
		loadingProduct,
		isErrorProduct,
		setShowPending,
		setSelectedProductId,
		refetchProductList,
		refetchProductDetails,
	};
};

export default useGetProducts;
