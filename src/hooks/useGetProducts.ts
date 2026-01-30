import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getApprovedProducts,
	getFeaturedProducts,
	getProductDetailsById,
} from "@/lib/tanstack-query/product.queries";
import type { BaseProduct } from "@/types/product";

// Query Options of Products
export const productsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["products"],
	queryFn: getApprovedProducts,
});

export const featuredProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["products", "featured"],
	queryFn: getFeaturedProducts,
	staleTime: 1000 * 60 * 5,
});

export const productbyIdQueryOpt = (id: string) =>
	queryOptions<BaseProduct>({
		queryKey: ["product", id],
		queryFn: () => getProductDetailsById(id),
		retry: false,
	});

//  UseGetProducts
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

	const {
		data: featuredProducts,
		isPending: loadingFeatured,
		isError: isErrorFeatured,
		refetch: refetchFeatured,
	} = useQuery(featuredProductsQueryOpt);

	return {
		productList,
		loadingProductList,
		isErrorProductList,
		showPending,
		product,
		loadingProduct,
		isErrorProduct,
		selectedProductId,
		featuredProducts,
		loadingFeatured,
		isErrorFeatured,
		setShowPending,
		setSelectedProductId,
		refetchProductList,
		refetchProductDetails,
		refetchFeatured,
	};
};

export default useGetProducts;
