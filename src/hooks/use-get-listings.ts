import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
	ApprovedListingCount,
	ApprovedListingSearchFilterQuery,
	ListingCountStatusQuery,
	ListingReadDto,
	PendingListingCount,
} from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import {
	type ApprovedListingSearchServerInput,
	getApprovedListingsProductApiFn as getApprovedListingsCompatibilityFn,
	getListingDetailsProductApiFn as getListingDetailsCompatibilityFn,
	getListingStatusCountProductApiFn as getListingStatusCountCompatibilityFn,
} from "@/server/listing-read.functions";

type ListingReadError = {
	readonly error: string;
	readonly details?: unknown;
};

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
		priceMin:
			filters?.priceMin !== undefined ? filters.priceMin.toString() : null,
		priceMax:
			filters?.priceMax !== undefined ? filters.priceMax.toString() : null,
	};
}

function toNullableQueryString(value: string | undefined): string | null {
	return value ? value : null;
}

function unwrapListingReadResult<T>(result: T | ListingReadError): T {
	if (isListingReadError(result)) {
		throw new Error(result.error);
	}

	return result;
}

function isListingReadError(value: unknown): value is ListingReadError {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	);
}

export const approvedListingsQueryOpt = (
	filters: ApprovedListingSearchFilterQuery,
) =>
	queryOptions<ListingReadDto[]>({
		queryKey: queryKeys.products.approved(filters),
		queryFn: async () => {
			const result = await getApprovedListingsCompatibilityFn({
				data: toApprovedListingSearchServerInput(filters),
			});

			return unwrapListingReadResult(result) as ListingReadDto[];
		},
		staleTime: 1000 * 60 * 5,
	});

export const featuredListingsQueryOpt = queryOptions<ListingReadDto[]>({
	queryKey: queryKeys.products.featured,
	queryFn: async () => {
		const result = await getApprovedListingsCompatibilityFn({
			data: {
				...toApprovedListingSearchServerInput({ limit: 5 }),
				random: "true",
			},
		});

		return unwrapListingReadResult(result) as ListingReadDto[];
	},
	staleTime: 1000 * 60 * 5,
});

export const listingByIdQueryOpt = (id: string) =>
	queryOptions<ListingReadDto>({
		queryKey: queryKeys.products.detail(id),
		queryFn: async () => {
			const result = await getListingDetailsCompatibilityFn({
				data: { listingId: id },
			});

			return unwrapListingReadResult(result) as ListingReadDto;
		},
		retry: false,
	});

export const listingCountByStatusQueryOpt = (status: ListingCountStatusQuery) =>
	queryOptions<ApprovedListingCount | PendingListingCount>({
		queryKey: queryKeys.products.countByStatus(status),
		queryFn: async () => {
			const result = await getListingStatusCountCompatibilityFn({
				data: { status },
			});

			return unwrapListingReadResult(result) as
				| ApprovedListingCount
				| PendingListingCount;
		},
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
	const {
		data: listing,
		isPending: isListingLoading,
		isError: isListingError,
		refetch: refetchListingDetails,
	} = useQuery({
		...listingByIdQueryOpt(id ?? ""),
		enabled: !!id,
	});

	return {
		listing,
		isListingLoading,
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
