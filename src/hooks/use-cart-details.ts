import { queryOptions, useQuery } from "@tanstack/react-query";
import { getProductsByIds } from "@/lib/tanstack-query/product-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { useCartStore } from "@/store/cart";
import type { BaseProduct } from "@/types/product";

export const cartDetailsQueryOpt = (productIds: string[]) =>
	queryOptions<BaseProduct[]>({
		queryKey: queryKeys.products.cartDetails(productIds),
		queryFn: () => getProductsByIds(productIds),
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
