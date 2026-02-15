import { useQueries } from "@tanstack/react-query";
import { productbyIdQueryOpt } from "@/hooks/use-get-products";
import { useCartStore } from "@/store/cart";

const useCartDetails = () => {
	const { items: cartItems, updateQuantity, removeItem } = useCartStore();

	const productQueries = useQueries({
		queries: cartItems.map((item) => productbyIdQueryOpt(item.productId)),
	});

	const cartWithDetails = cartItems.map((cartItem, index) => ({
		...cartItem,
		product: productQueries[index].data,
		isLoading: productQueries[index].isPending,
		isError: productQueries[index].isError,
	}));

	const isCartEmpty = cartItems.length === 0;
	const isLoading = productQueries.some((query) => query.isPending);

	const totalPrice = cartWithDetails.reduce((sum, item) => {
		if (item.product) {
			return sum + item.quantity * item.product.price;
		}
		return sum;
	}, 0);

	const cartCount = useCartStore((state) =>
		state.items.reduce((total, item) => total + item.quantity, 0),
	);

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
