import { queryOptions, useQuery } from "@tanstack/react-query";
import {
	calculateListingCartSubtotal,
	type ListingCartSubtotalError,
	type ListingCartSubtotalLine,
} from "@/domains/listings/application/listing-money";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getCartListingsServerFn } from "@/server/listing-query.functions";
import { type CartItem, useCartStore } from "@/store/cart";
import type { CartDetail } from "@/types/cart";
import type { OrderItem } from "@/types/order";
import { formatMoneyAmountMinor } from "@/utils/format-money";

const unavailableListingMessage = "Remove this item or try again later";

export type CartPricingState =
	| {
			readonly status: "loading";
			readonly message: string;
	  }
	| {
			readonly status: "load-error";
			readonly message: string;
	  }
	| {
			readonly status: "priced";
			readonly totalPriceAmountMinor: number;
			readonly currencyCode: string;
	  }
	| {
			readonly status: "unavailable-items";
			readonly unavailableListingIds: string[];
			readonly message: string;
	  }
	| {
			readonly status: "invalid-money";
			readonly error: ListingCartSubtotalError;
			readonly message: string;
	  };

export type CheckoutCartState =
	| {
			readonly status: "ready";
			readonly items: OrderItem[];
	  }
	| {
			readonly status: "not-ready";
			readonly message: string;
	  };

function toListingCartSubtotalLines(
	cartDetails: CartDetail[],
): ListingCartSubtotalLine[] {
	return cartDetails.flatMap((detail) =>
		detail.status === "available"
			? [
					{
						priceAmountMinor: detail.listing.priceAmountMinor,
						currencyCode: detail.listing.currencyCode,
						quantity: detail.quantity,
					},
				]
			: [],
	);
}

export const cartDetailsQueryOpt = (listingIds: string[]) =>
	queryOptions<ListingResponse[]>({
		queryKey: queryKeys.listings.cartDetails(listingIds),
		queryFn: async () =>
			getCartListingsServerFn({
				data: { ids: listingIds },
			}),
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
		new Set(cartItems.map((item) => item.listingId)),
	).sort();
	const shouldFetchCartDetails = enabled && uniqueListingIds.length > 0;

	const {
		data: listings = [],
		isPending: isLoadingListings,
		isError: isCartDetailsError,
	} = useQuery({
		...cartDetailsQueryOpt(uniqueListingIds),
		enabled: shouldFetchCartDetails,
	});
	const cartDetailsLoadFailed = shouldFetchCartDetails && isCartDetailsError;

	const listingsById = new Map(
		listings.map((listing) => [listing.id, listing]),
	);

	const cartDetails = cartDetailsLoadFailed
		? []
		: cartItems.map((cartItem) =>
				toCartDetail(cartItem, listingsById.get(cartItem.listingId)),
			);

	const isCartEmpty = cartItems.length === 0;
	const isLoading = shouldFetchCartDetails && isLoadingListings;
	const unavailableListingIds = cartDetails
		.filter((detail) => detail.status === "unavailable")
		.map((detail) => detail.listingId);
	const cartPricing = getCartPricingState({
		isLoading: isLoading || (!enabled && uniqueListingIds.length > 0),
		isLoadError: cartDetailsLoadFailed,
		unavailableListingIds,
		cartDetails,
	});
	const checkoutCart = getCheckoutCartState({
		cartDetails,
		cartPricing,
	});

	const cartCount = cartDetails.reduce(
		(total, detail) => total + detail.quantity,
		0,
	);

	const handleRemoveItem = (id: string) => {
		removeItem(id);
	};

	const handleQuantityChange = (quantity: number, listingId: string) => {
		const listing = listingsById.get(listingId);

		if (!listing) {
			return;
		}

		updateQuantity(listingId, clampCartQuantity(quantity, listing.stock));
	};

	return {
		isCartEmpty,
		isLoading,
		cartPricing,
		checkoutCart,
		cartCount,
		cartDetails,
		handleRemoveItem,
		handleQuantityChange,
	};
};

function clampCartQuantity(quantity: number, stock: number): number {
	if (!Number.isSafeInteger(quantity) || quantity < 1) {
		return 1;
	}

	if (!Number.isSafeInteger(stock) || stock < 1) {
		return 1;
	}

	return Math.min(quantity, stock);
}

function toCartDetail(cartItem: CartItem, listing: ListingResponse | undefined) {
	if (!listing) {
		return {
			status: "unavailable",
			listingId: cartItem.listingId,
			quantity: cartItem.quantity,
			title: "Listing unavailable",
			description: unavailableListingMessage,
			unitPriceText: "Unavailable",
			subtotalText: "Unavailable",
			imageAlt: "Listing unavailable",
		} satisfies CartDetail;
	}

	const effectiveQuantity = clampCartQuantity(cartItem.quantity, listing.stock);

	return {
		status: "available",
		listingId: cartItem.listingId,
		quantity: effectiveQuantity,
		listing,
		title: listing.name,
		description: `${listing.brand} • ${listing.model}`,
		unitPriceText: formatMoneyAmountMinor(
			listing.priceAmountMinor,
			listing.currencyCode,
		),
		subtotalText: formatMoneyAmountMinor(
			listing.priceAmountMinor * effectiveQuantity,
			listing.currencyCode,
		),
		imageUrl: listing.images[0]?.url,
		imageAlt: listing.name,
	} satisfies CartDetail;
}

function getCartPricingState({
	isLoading,
	isLoadError,
	unavailableListingIds,
	cartDetails,
}: {
	readonly isLoading: boolean;
	readonly isLoadError: boolean;
	readonly unavailableListingIds: string[];
	readonly cartDetails: CartDetail[];
}): CartPricingState {
	if (isLoading) {
		return {
			status: "loading",
			message: "Cart prices are loading",
		};
	}

	if (isLoadError) {
		return {
			status: "load-error",
			message: "Cart items could not be loaded. Try refreshing the page.",
		};
	}

	if (unavailableListingIds.length > 0) {
		return {
			status: "unavailable-items",
			unavailableListingIds,
			message: "Some cart items are unavailable, so the total cannot be shown",
		};
	}

	const subtotal = calculateListingCartSubtotal(
		toListingCartSubtotalLines(cartDetails),
	);

	if (subtotal.status === "invalid") {
		return {
			status: "invalid-money",
			error: subtotal.error,
			message: subtotal.error.message,
		};
	}

	return {
		status: "priced",
		totalPriceAmountMinor: subtotal.subtotal.amountMinor,
		currencyCode: subtotal.subtotal.currencyCode,
	};
}

function getCheckoutCartState({
	cartDetails,
	cartPricing,
}: {
	readonly cartDetails: CartDetail[];
	readonly cartPricing: CartPricingState;
}): CheckoutCartState {
	if (cartDetails.length === 0) {
		return {
			status: "not-ready",
			message: "Your cart is empty",
		};
	}

	if (cartPricing.status !== "priced") {
		return {
			status: "not-ready",
			message: cartPricing.message,
		};
	}

	return {
		status: "ready",
		items: cartDetails.flatMap((detail) =>
			detail.status === "available"
				? [{ listingId: detail.listingId, quantity: detail.quantity }]
				: [],
		),
	};
}

export default useCartDetails;
