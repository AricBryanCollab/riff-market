import type { ApprovedListingCount } from "@/domains/listings/dto/listing-view";
import {
	useApprovedListingCount,
	useApprovedListings,
} from "@/hooks/use-get-listings";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";
import { SHOP_PAGE_SIZE } from "@/utils/shop-search";

const useShopPagination = () => {
	const { approvedFilters, page, setPage } = useShopSearchFilters();
	const pageSize = approvedFilters.limit ?? SHOP_PAGE_SIZE;

	const { listingCount, isErrorListingCount, loadingListingCount } =
		useApprovedListingCount();

	const { listings, isLoadingListings, isErrorListings, refetchListings } =
		useApprovedListings(approvedFilters);

	const totalListings =
		(listingCount as ApprovedListingCount | undefined)?.approvedListingCount ??
		0;

	const totalPages = Math.ceil(totalListings / pageSize);

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

	const hasListings = (listings?.length ?? 0) > 0;
	const isFirstPage = page === 0;

	const isLastPage = page >= totalPages - 1;

	const isError = isErrorListings || isErrorListingCount;
	const isLoading = isLoadingListings || loadingListingCount;

	return {
		listings,
		isLoading,
		isError,
		page,
		pageSize,
		totalPages,
		hasListings,
		isFirstPage,
		isLastPage,
		refetchListings,
		nextPage,
		previousPage,
		goToPage,
	};
};

export default useShopPagination;
