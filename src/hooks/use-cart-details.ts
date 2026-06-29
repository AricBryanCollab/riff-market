import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getCartListingsProductApiFn as getCartListingsCompatibilityFn } from "@/server/listing-read.functions";
import { useCartStore } from "@/store/cart";

type ListingReadError = {
	readonly error: string;
};

function unwrapListingReadResult<T>(result: T | ListingReadError): T {
	if (
		typeof result === "object" &&
		result !== null &&
		"error" in result &&
		typeof result.error === "string"
	) {
		throw new Error(result.error);
	}

	return result as T;
}

export const cartDetailsQueryOpt = (listingIds: string[]) =>
	queryOptions<ListingReadDto[]>({
		queryKey: queryKeys.products.cartDetails(listingIds),
		queryFn: async () => {
			const result = await getCartListingsCompatibilityFn({
				data: {
					ids: listingIds,
				},
			});

			return unwrapListingReadResult(result) as ListingReadDto[];
		},
		staleTime: 1000 * 60 * 2,
	});

interface UseCartDetailsOptions {
	enabled?: boolean;
}

const useCartDetails = (options: UseCartDetailsOptions = {}) => {
	const cartItems = useCartStore((state) => state.items);
	const updateQuantity = useCartStore((state) => state.updateQuantity);
	const removeItem = useCartStore((state) => state.removeItem);
	const enabled = options.enabled ?? true;

	const uniqueListingIds = Array.from(
		new Set(cartItems.map((item) => item.productId)),
	).sort();
	const shouldFetchCartDetails = enabled && uniqueListingIds.length > 0;

	const {
		data: listings = [],
		isPending: isLoadingListings,
		isError: isErrorListings,
	} = useQuery({
		...cartDetailsQueryOpt(uniqueListingIds),
		enabled: shouldFetchCartDetails,
	});

	const listingsById = new Map(
		listings.map((listing) => [listing.id, listing]),
	);

	const cartWithDetails = cartItems.map((cartItem) => {
		const listing = listingsById.get(cartItem.productId);

		return {
			...cartItem,
			listing,
			isLoading: shouldFetchCartDetails && isLoadingListings && !listing,
			isError:
				shouldFetchCartDetails &&
				!isLoadingListings &&
				(isErrorListings || !listing),
		};
	});

	const isCartEmpty = cartItems.length === 0;
	const isLoading = shouldFetchCartDetails && isLoadingListings;

	const totalPrice = cartWithDetails.reduce((sum, item) => {
		if (item.listing) {
			return sum + item.quantity * item.listing.price;
		}
		return sum;
	}, 0);

	const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

	const handleRemoveItem = (id: string) => {
		removeItem(id);
	};

	const handleQuantityChange = (quantity: number, listingId: string) => {
		updateQuantity(listingId, quantity);
	};

	return {
		isCartEmpty,
		isLoading,
		totalPrice,
		cartCount,
		cartWithDetails,
		handleRemoveItem,
		handleQuantityChange,
	};
};

export default useCartDetails;
