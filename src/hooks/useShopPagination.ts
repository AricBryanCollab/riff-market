import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { approvedProductsWithQueryOpt } from "@/hooks/useGetProducts";
import { getProductCountByStatus } from "@/lib/tanstack-query/product.queries";
import type {
	ApprovedProductCount,
	PendingProductCount,
	ProductCountStatusQuery,
} from "@/types/product";

const productCountQueryOpt = (status: ProductCountStatusQuery) =>
	queryOptions<ApprovedProductCount | PendingProductCount>({
		queryKey: ["approvedProduct", "count"],
		queryFn: () => getProductCountByStatus(status),
	});

const useShopPagination = () => {
	const [page, setPage] = useState<number>(0);
	const [pageSize, setPageSize] = useState<number>(12);

	const offset = page * pageSize;

	const nextPage = () => {
		setPage((prev) => prev + 1);
	};

	const previousPage = () => {
		setPage((prev) => Math.max(0, prev - 1));
	};

	const goToPage = (pageNumber: number) => {
		setPage(Math.max(0, pageNumber));
	};

	const {
		data: productList,
		isPending: loadingProductList,
		isError: isErrorProductList,
		refetch: refetchProductList,
	} = useQuery(approvedProductsWithQueryOpt(pageSize, offset));

	const {
		data: productCount,
		isError: isErrorProductCount,
		isPending: loadingProductCount,
	} = useQuery(productCountQueryOpt("approved"));

	const totalProducts =
		(productCount as ApprovedProductCount | undefined)?.approvedProductCount ??
		0;

	const totalPages = Math.ceil(totalProducts / pageSize);

	const hasProducts = (productList?.length ?? 0) > 0;
	const isFirstPage = page === 0;
	const isLastPage = (productList?.length ?? 0) < pageSize;

	const isError = isErrorProductList || isErrorProductCount;
	const isLoading = loadingProductList || loadingProductCount;

	return {
		productList,
		isLoading,
		isError,
		page,
		pageSize,
		totalPages,
		hasProducts,
		isFirstPage,
		isLastPage,
		refetchProductList,
		nextPage,
		previousPage,
		goToPage,
		setPageSize,
	};
};

export default useShopPagination;
