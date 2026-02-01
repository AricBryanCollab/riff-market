import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getAllApprovedProducts,
	getApprovedProducts,
	getFeaturedProducts,
	getProductDetailsById,
} from "@/lib/tanstack-query/product.queries";
import type { BaseProduct } from "@/types/product";

// Query Options of Products
export const approvedProductsWithQueryOpt = (limit = 12, offset = 0) =>
	queryOptions<BaseProduct[]>({
		queryKey: ["products", { limit, offset }],
		queryFn: () => getApprovedProducts(limit, offset),
	});

export const allApprovedProductsQueryOpt = queryOptions<BaseProduct[]>({
	queryKey: ["products", "all"],
	queryFn: getAllApprovedProducts,
	staleTime: 1000 * 60 * 5,
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
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);

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
		product,
		loadingProduct,
		isErrorProduct,
		selectedProductId,
		featuredProducts,
		loadingFeatured,
		isErrorFeatured,
		setSelectedProductId,
		refetchProductDetails,
		refetchFeatured,
	};
};

export default useGetProducts;
