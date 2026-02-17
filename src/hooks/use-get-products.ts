import { queryOptions, useQuery } from "@tanstack/react-query";
import {
	getApprovedProducts,
	getFeaturedProducts,
	getProductCountByStatus,
	getProductDetailsById,
} from "@/lib/tanstack-query/product-queries";
import type {
	ApprovedProductCount,
	BaseProduct,
	GetApprovedProductsFilterQuery,
	PendingProductCount,
	ProductCountStatusQuery,
} from "@/types/product";

export const approvedProductsQueryOpt = (
	filters: GetApprovedProductsFilterQuery,
) =>
	queryOptions<BaseProduct[]>({
		queryKey: ["products", "approved", filters],
		queryFn: () => getApprovedProducts(filters),
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

export const productCountByStatusQueryOpt = (status: ProductCountStatusQuery) =>
	queryOptions<ApprovedProductCount | PendingProductCount>({
		queryKey: ["products", "count", status],
		queryFn: () => getProductCountByStatus(status),
	});

export const useApprovedProducts = (
	filters: GetApprovedProductsFilterQuery,
) => {
	const {
		data: products,
		isPending: isLoadingProducts,
		isError: isErrorProducts,
		refetch: refetchProducts,
	} = useQuery(approvedProductsQueryOpt(filters));

	return {
		products,
		isLoadingProducts,
		isErrorProducts,
		refetchProducts,
		filters,
	};
};

export const useApprovedProductCount = () => {
	const {
		data: productCount,
		isError: isErrorProductCount,
		isPending: loadingProductCount,
	} = useQuery(productCountByStatusQueryOpt("approved"));

	return {
		productCount,
		isErrorProductCount,
		loadingProductCount,
	};
};

export const useProductById = (id?: string | null) => {
	const {
		data: product,
		isPending: loadingProduct,
		isError: isErrorProduct,
		refetch: refetchProductDetails,
	} = useQuery({
		...productbyIdQueryOpt(id ?? ""),
		enabled: !!id,
	});

	return {
		product,
		loadingProduct,
		isErrorProduct,
		refetchProductDetails,
	};
};

export const useFeaturedProducts = () => {
	const {
		data: featuredProducts,
		isPending: loadingFeatured,
		isError: isErrorFeatured,
		refetch: refetchFeatured,
	} = useQuery(featuredProductsQueryOpt);

	return {
		featuredProducts,
		loadingFeatured,
		isErrorFeatured,
		refetchFeatured,
	};
};
