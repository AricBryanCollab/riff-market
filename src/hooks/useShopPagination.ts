import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { approvedProductsWithQueryOpt } from "@/hooks/useGetProducts";

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

	const hasProducts = (productList?.length ?? 0) > 0;
	const isFirstPage = page === 0;
	const isLastPage = (productList?.length ?? 0) < pageSize;

	return {
		productList,
		loadingProductList,
		isErrorProductList,
		page,
		pageSize,
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
