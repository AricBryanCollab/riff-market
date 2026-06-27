import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getCartListingsProductApiFn } from "@/server/listing-read.functions";
import { useCartStore } from "@/store/cart";

type ProductReadError = {
	readonly error: string;
};

function unwrapProductReadResult<T>(result: T | ProductReadError): T {
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

export const cartDetailsQueryOpt = (productIds: string[]) =>
	queryOptions<ListingReadDto[]>({
		queryKey: queryKeys.products.cartDetails(productIds),
		queryFn: async () => {
			const result = await getCartListingsProductApiFn({
				data: {
					ids: productIds,
				},
			});

			return unwrapProductReadResult(result) as ListingReadDto[];
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

	const uniqueProductIds = Array.from(
		new Set(cartItems.map((item) => item.productId)),
	).sort();
	const shouldFetchCartDetails = enabled && uniqueProductIds.length > 0;

	const {
		data: products = [],
		isPending: isLoadingProducts,
		isError: isErrorProducts,
	} = useQuery({
		...cartDetailsQueryOpt(uniqueProductIds),
		enabled: shouldFetchCartDetails,
	});

	const productsById = new Map(
		products.map((product) => [product.id, product]),
	);

	const cartWithDetails = cartItems.map((cartItem) => {
		const product = productsById.get(cartItem.productId);

		return {
			...cartItem,
			product,
			isLoading: shouldFetchCartDetails && isLoadingProducts && !product,
			isError:
				shouldFetchCartDetails &&
				!isLoadingProducts &&
				(isErrorProducts || !product),
		};
	});

	const isCartEmpty = cartItems.length === 0;
	const isLoading = shouldFetchCartDetails && isLoadingProducts;

	const totalPrice = cartWithDetails.reduce((sum, item) => {
		if (item.product) {
			return sum + item.quantity * item.product.price;
		}
		return sum;
	}, 0);

	const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

	const handleRemoveItem = (id: string) => {
		removeItem(id);
	};

	const handleQuantityChange = (quantity: number, productId: string) => {
		updateQuantity(productId, quantity);
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
