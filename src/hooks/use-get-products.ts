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
	getApprovedListingsProductApiFn,
	getListingDetailsProductApiFn,
	getListingStatusCountProductApiFn,
	type ProductApiQueryInput,
} from "@/server/listing-read.functions";

type ProductReadError = {
	readonly error: string;
	readonly details?: unknown;
};

function toProductApiQueryInput(
	filters: ApprovedListingSearchFilterQuery,
): ProductApiQueryInput {
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

function unwrapProductReadResult<T>(result: T | ProductReadError): T {
	if (isProductReadError(result)) {
		throw new Error(result.error);
	}

	return result;
}

function isProductReadError(value: unknown): value is ProductReadError {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	);
}

export const approvedProductsQueryOpt = (
	filters: ApprovedListingSearchFilterQuery,
) =>
	queryOptions<ListingReadDto[]>({
		queryKey: queryKeys.products.approved(filters),
		queryFn: async () => {
			const result = await getApprovedListingsProductApiFn({
				data: toProductApiQueryInput(filters),
			});

			return unwrapProductReadResult(result) as ListingReadDto[];
		},
		staleTime: 1000 * 60 * 5,
	});

export const featuredProductsQueryOpt = queryOptions<ListingReadDto[]>({
	queryKey: queryKeys.products.featured,
	queryFn: async () => {
		const result = await getApprovedListingsProductApiFn({
			data: {
				...toProductApiQueryInput({ limit: 5 }),
				random: "true",
			},
		});

		return unwrapProductReadResult(result) as ListingReadDto[];
	},
	staleTime: 1000 * 60 * 5,
});

export const productbyIdQueryOpt = (id: string) =>
	queryOptions<ListingReadDto>({
		queryKey: queryKeys.products.detail(id),
		queryFn: async () => {
			const result = await getListingDetailsProductApiFn({
				data: { listingId: id },
			});

			return unwrapProductReadResult(result) as ListingReadDto;
		},
		retry: false,
	});

export const productCountByStatusQueryOpt = (status: ListingCountStatusQuery) =>
	queryOptions<ApprovedListingCount | PendingListingCount>({
		queryKey: queryKeys.products.countByStatus(status),
		queryFn: async () => {
			const result = await getListingStatusCountProductApiFn({
				data: { status },
			});

			return unwrapProductReadResult(result) as
				| ApprovedListingCount
				| PendingListingCount;
		},
	});

export const useApprovedProducts = (
	filters: ApprovedListingSearchFilterQuery,
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
