import { queryOptions, useQuery } from "@tanstack/react-query";
import {
	calculateListingCartSubtotal,
	type ListingCartSubtotalError,
	type ListingCartSubtotalLine,
} from "@/domains/listings/application/listing-money";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { fetchCartListings } from "@/lib/tanstack-query/listing-read-client";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { type CartItem, useCartStore } from "@/store/cart";
import type { CartLine } from "@/types/cart";
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
	lines: CartLine[],
): ListingCartSubtotalLine[] {
	return lines.flatMap((line) =>
		line.status === "available"
			? [
					{
						priceAmountMinor: line.listing.priceAmountMinor,
						currencyCode: line.listing.currencyCode,
						quantity: line.quantity,
					},
				]
			: [],
	);
}

export const cartDetailsQueryOpt = (listingIds: string[]) =>
	queryOptions<ListingReadDto[]>({
		queryKey: queryKeys.listings.cartDetails(listingIds),
		queryFn: async () => fetchCartListings(listingIds),
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

	const cartLines = cartDetailsLoadFailed
		? []
		: cartItems.map((cartItem) =>
				toCartLine(cartItem, listingsById.get(cartItem.listingId)),
			);

	const isCartEmpty = cartItems.length === 0;
	const isLoading = shouldFetchCartDetails && isLoadingListings;
	const unavailableListingIds = cartLines
		.filter((line) => line.status === "unavailable")
		.map((line) => line.listingId);
	const cartPricing = getCartPricingState({
		isLoading: isLoading || (!enabled && uniqueListingIds.length > 0),
		isLoadError: cartDetailsLoadFailed,
		unavailableListingIds,
		lines: cartLines,
	});
	const checkoutCart = getCheckoutCartState({
		lines: cartLines,
		cartPricing,
	});

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
		cartPricing,
		checkoutCart,
		cartCount,
		cartLines,
		handleRemoveItem,
		handleQuantityChange,
	};
};

function toCartLine(cartItem: CartItem, listing: ListingReadDto | undefined) {
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
		} satisfies CartLine;
	}

	return {
		status: "available",
		listingId: cartItem.listingId,
		quantity: cartItem.quantity,
		listing,
		title: listing.name,
		description: `${listing.brand} • ${listing.model}`,
		unitPriceText: formatMoneyAmountMinor(
			listing.priceAmountMinor,
			listing.currencyCode,
		),
		subtotalText: formatMoneyAmountMinor(
			listing.priceAmountMinor * cartItem.quantity,
			listing.currencyCode,
		),
		imageUrl: listing.images[0]?.url,
		imageAlt: listing.name,
	} satisfies CartLine;
}

function getCartPricingState({
	isLoading,
	isLoadError,
	unavailableListingIds,
	lines,
}: {
	readonly isLoading: boolean;
	readonly isLoadError: boolean;
	readonly unavailableListingIds: string[];
	readonly lines: CartLine[];
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
		toListingCartSubtotalLines(lines),
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
	lines,
	cartPricing,
}: {
	readonly lines: CartLine[];
	readonly cartPricing: CartPricingState;
}): CheckoutCartState {
	if (lines.length === 0) {
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
		items: lines.flatMap((line) =>
			line.status === "available"
				? [{ listingId: line.listingId, quantity: line.quantity }]
				: [],
		),
	};
}

export default useCartDetails;
