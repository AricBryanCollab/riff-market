import useGetProducts from "@/hooks/use-get-products";
import { useProductStore } from "@/store/products";
import type { ApprovedProductCount } from "@/types/product";

const useShopPagination = () => {
	const page = useProductStore((state) => state.page);
	const pageSize = useProductStore((state) => state.pageSize);
	const setPage = useProductStore((state) => state.setPage);
	const setPageSize = useProductStore((state) => state.setPageSize);

	const {
		productCount,
		isErrorProductCount,
		loadingProductCount,
		products,
		isLoadingProducts,
		isErrorProducts,
		refetchProducts,
	} = useGetProducts();

	const totalProducts =
		(productCount as ApprovedProductCount | undefined)?.approvedProductCount ??
		0;

	const totalPages = Math.ceil(totalProducts / pageSize);

	const nextPage = () => {
		const nextPageNum = page + 1;
		if (nextPageNum < totalPages) {
			setPage(nextPageNum);
		}
	};

	const previousPage = () => {
		const prevPageNum = Math.max(0, page - 1);
		setPage(prevPageNum);
	};

	const goToPage = (pageNumber: number) => {
		const clampedPage = Math.max(0, Math.min(pageNumber, totalPages - 1));
		setPage(clampedPage);
	};

	const hasProducts = (products?.length ?? 0) > 0;
	const isFirstPage = page === 0;

	const isLastPage = page >= totalPages - 1;

	const isError = isErrorProducts || isErrorProductCount;
	const isLoading = isLoadingProducts || loadingProductCount;

	return {
		products,
		isLoading,
		isError,
		page,
		pageSize,
		totalPages,
		hasProducts,
		isFirstPage,
		isLastPage,
		refetchProducts,
		nextPage,
		previousPage,
		goToPage,
		setPageSize,
	};
};

export default useShopPagination;
