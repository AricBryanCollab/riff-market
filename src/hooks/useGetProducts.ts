import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	getApprovedProducts,
	getFeaturedProducts,
	getProductCountByStatus,
	getProductDetailsById,
} from "@/lib/tanstack-query/product.queries";
import { useProductStore } from "@/store/products";
import type {
	ApprovedProductCount,
	BaseProduct,
	GetApprovedProcutsFilterQuery,
	PendingProductCount,
	ProductCountStatusQuery,
} from "@/types/product";

// Query Options of Products
const approvedProductsWithQueryOpt = (filters: GetApprovedProcutsFilterQuery) =>
	queryOptions<BaseProduct[]>({
		queryKey: ["products", "approved", filters],
		queryFn: () => getApprovedProducts(filters),
		staleTime: 1000 * 60 * 5,
	});

const featuredProductsQueryOpt = queryOptions<BaseProduct[]>({
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

const productCountQueryOpt = (status: ProductCountStatusQuery) =>
	queryOptions<ApprovedProductCount | PendingProductCount>({
		queryKey: ["products", "count"],
		queryFn: () => getProductCountByStatus(status),
	});

//  useGetProducts
const useGetProducts = () => {
	const filters = useProductStore((state) => state.filters);
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);

	// Approved Products
	const {
		data: products,
		isPending: isLoadingProducts,
		isError: isErrorProducts,
		refetch: refetchProducts,
	} = useQuery(approvedProductsWithQueryOpt(filters));

	// Approved Product Count
	const {
		data: productCount,
		isError: isErrorProductCount,
		isPending: loadingProductCount,
	} = useQuery(productCountQueryOpt("approved"));

	// Product By ID
	const {
		data: product,
		isPending: loadingProduct,
		isError: isErrorProduct,
		refetch: refetchProductDetails,
	} = useQuery({
		...productbyIdQueryOpt(selectedProductId ?? ""),
		enabled: !!selectedProductId,
	});

	// Featured Products
	const {
		data: featuredProducts,
		isPending: loadingFeatured,
		isError: isErrorFeatured,
		refetch: refetchFeatured,
	} = useQuery(featuredProductsQueryOpt);

	return {
		// Products
		products,
		isLoadingProducts,
		isErrorProducts,
		refetchProducts,
		filters,

		// Approved Product Count
		productCount,
		isErrorProductCount,
		loadingProductCount,

		// Single Product
		product,
		loadingProduct,
		isErrorProduct,
		selectedProductId,
		setSelectedProductId,
		refetchProductDetails,

		// Featured Products
		featuredProducts,
		loadingFeatured,
		isErrorFeatured,
		refetchFeatured,
	};
};

export default useGetProducts;
