import type { ApprovedListingCount } from "@/domains/listings/dto/listing-read-model";
import {
	useApprovedProductCount,
	useApprovedProducts,
} from "@/hooks/use-get-products";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";
import { SHOP_PAGE_SIZE } from "@/utils/shop-search";

const useShopPagination = () => {
	const { approvedFilters, page, setPage } = useShopSearchFilters();
	const pageSize = approvedFilters.limit ?? SHOP_PAGE_SIZE;

	const { productCount, isErrorProductCount, loadingProductCount } =
		useApprovedProductCount();

	const { products, isLoadingProducts, isErrorProducts, refetchProducts } =
		useApprovedProducts(approvedFilters);

	const totalProducts =
		(productCount as ApprovedListingCount | undefined)?.approvedProductCount ??
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
	};
};

export default useShopPagination;
