import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
	ApprovedListingCount,
	ListingResponse,
	PendingListingCount,
} from "@/domains/listings/dto/listing-view";
import {
	type ApprovedListingSearchServerInput,
	fetchApprovedListings,
	fetchListingDetails,
	fetchListingStatusCount,
	type ListingCountStatusQuery,
} from "@/lib/tanstack-query/listing-query-client";
import {
	type ListingDetailViewerScope,
	listingDetailViewerScopeForRole,
	queryKeys,
} from "@/lib/tanstack-query/query-keys";
import type { ApprovedListingSearchFilterQuery } from "@/utils/shop-search";
import { useAuthUser } from "./use-auth-user";

function toApprovedListingSearchServerInput(
	filters: ApprovedListingSearchFilterQuery,
): ApprovedListingSearchServerInput {
	return {
		limit: filters?.limit !== undefined ? filters.limit.toString() : null,
		offset: filters?.offset !== undefined ? filters.offset.toString() : null,
		random: null,
		category: toNullableQueryString(filters?.category),
		brand: toNullableQueryString(filters?.brand),
		search: toNullableQueryString(filters?.search),
		condition: toNullableQueryString(filters?.condition),
		priceMin: filters?.priceMin ?? null,
		priceMax: filters?.priceMax ?? null,
	};
}

function toNullableQueryString(value: string | undefined): string | null {
	return value ? value : null;
}

export const approvedListingsQueryOpt = (
	filters: ApprovedListingSearchFilterQuery,
) =>
	queryOptions<ListingResponse[]>({
		queryKey: queryKeys.listings.approved(filters),
		queryFn: async () => {
			return fetchApprovedListings(toApprovedListingSearchServerInput(filters));
		},
		staleTime: 1000 * 60 * 5,
	});

export const featuredListingsQueryOpt = queryOptions<ListingResponse[]>({
	queryKey: queryKeys.listings.featured,
	queryFn: async () => {
		return fetchApprovedListings({
			...toApprovedListingSearchServerInput({ limit: 5 }),
			random: "true",
		});
	},
	staleTime: 1000 * 60 * 5,
});

export const listingByIdQueryOpt = (
	id: string,
	viewerScope: ListingDetailViewerScope = "public",
) =>
	queryOptions<ListingResponse>({
		queryKey: queryKeys.listings.detail(id, viewerScope),
		queryFn: async () => fetchListingDetails(id),
		retry: false,
	});

export const listingCountByStatusQueryOpt = (status: ListingCountStatusQuery) =>
	queryOptions<ApprovedListingCount | PendingListingCount>({
		queryKey: queryKeys.listings.countByStatus(status),
		queryFn: async () => fetchListingStatusCount(status),
	});

export const useApprovedListings = (
	filters: ApprovedListingSearchFilterQuery,
) => {
	const {
		data: listings,
		isPending: isLoadingListings,
		isError: isErrorListings,
		refetch: refetchListings,
	} = useQuery(approvedListingsQueryOpt(filters));

	return {
		listings,
		isLoadingListings,
		isErrorListings,
		refetchListings,
		filters,
	};
};

export const useApprovedListingCount = () => {
	const {
		data: listingCount,
		isError: isErrorListingCount,
		isPending: loadingListingCount,
	} = useQuery(listingCountByStatusQueryOpt("approved"));

	return {
		listingCount,
		isErrorListingCount,
		loadingListingCount,
	};
};

export const useListingById = (id?: string | null) => {
	const { data: user, isPending: isAuthPending } = useAuthUser();
	const viewerScope = listingDetailViewerScopeForRole(user?.role);
	const {
		data: listing,
		isPending: isListingLoading,
		isError: isListingError,
		refetch: refetchListingDetails,
	} = useQuery({
		...listingByIdQueryOpt(id ?? "", viewerScope),
		enabled: !!id && !isAuthPending,
	});

	return {
		listing,
		isListingLoading: isAuthPending || isListingLoading,
		isListingError,
		refetchListingDetails,
	};
};

export const useFeaturedListings = () => {
	const {
		data: featuredListings,
		isPending: loadingFeaturedListings,
		isError: isErrorFeaturedListings,
		refetch: refetchFeaturedListings,
	} = useQuery(featuredListingsQueryOpt);

	return {
		featuredListings,
		loadingFeaturedListings,
		isErrorFeaturedListings,
		refetchFeaturedListings,
	};
};
