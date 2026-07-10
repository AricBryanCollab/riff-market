import { queryOptions, useQuery } from "@tanstack/react-query";
import { FEATURED_LISTINGS_SAMPLE_SIZE } from "@/domains/listings/application/listing-queries";
import type {
	ApprovedListingCount,
	ListingDetailResponse,
	ListingResponse,
	PendingListingCount,
} from "@/domains/listings/dto/listing-view";
import {
	type ListingCountStatusQuery,
	queryKeys,
} from "@/lib/tanstack-query/query-keys";
import {
	type ApprovedListingSearchServerInput,
	getApprovedListingsServerFn,
	getListingDetailsServerFn,
	getListingStatusCountServerFn,
} from "@/server/listing-query.functions";
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
		queryFn: async () =>
			getApprovedListingsServerFn({
				data: toApprovedListingSearchServerInput(filters),
			}),
		staleTime: 1000 * 60 * 5,
	});

export const featuredListingsQueryOpt = queryOptions<ListingResponse[]>({
	queryKey: queryKeys.listings.featured,
	queryFn: async () =>
		getApprovedListingsServerFn({
			data: {
				...toApprovedListingSearchServerInput({
					limit: FEATURED_LISTINGS_SAMPLE_SIZE,
				}),
				random: "true",
			},
		}),
	staleTime: 1000 * 60 * 5,
});

export const listingByIdQueryOpt = (
	id: string,
	viewerKey: string = "public",
) =>
	queryOptions<ListingDetailResponse>({
		queryKey: queryKeys.listings.detail(id, viewerKey),
		queryFn: async () =>
			getListingDetailsServerFn({
				data: { listingId: id },
			}),
		retry: false,
	});

export const listingCountByStatusQueryOpt = (status: ListingCountStatusQuery) =>
	queryOptions<ApprovedListingCount | PendingListingCount>({
		queryKey: queryKeys.listings.countByStatus(status),
		queryFn: async () =>
			getListingStatusCountServerFn({
				data: { status },
			}),
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
	const viewerKey = user?.id ?? "public";
	const {
		data: listing,
		isPending: isListingLoading,
		isError: isListingError,
		refetch: refetchListingDetails,
	} = useQuery({
		...listingByIdQueryOpt(id ?? "", viewerKey),
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
