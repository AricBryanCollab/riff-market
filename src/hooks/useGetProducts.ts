import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getApprovedProducts,
	getProductDetailsById,
} from "@/lib/tanstack-query/product.queries";
import type { BaseProduct } from "@/types/product";

export const productsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["products"],
	queryFn: getApprovedProducts,
});

export const productbyIdQueryOpt = (id: string) =>
	queryOptions<BaseProduct>({
		queryKey: ["product", id],
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
		product,
		loadingProduct,
		isErrorProduct,
		selectedProductId,
		setShowPending,
		setSelectedProductId,
		refetchProductList,
		refetchProductDetails,
	};
};

export default useGetProducts;
