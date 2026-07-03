import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { CheckoutCartState } from "@/hooks/use-cart-details";
import { clientLogger } from "@/lib/client-logger";
import {
	invalidateListingCache,
	invalidateOrdersCache,
} from "@/lib/tanstack-query/cache-policy";
import { createOrder } from "@/lib/tanstack-query/orders-queries";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";

const usePlaceOrder = (checkoutCart: CheckoutCartState) => {
	const clearCart = useCartStore((state) => state.clearCart);
	const { data: user } = useAuthUser();
	const address = user?.address ?? null;
	const showToast = useToastStore((state) => state.showToast);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [shippingAddress, setShippingAddress] = useState<string>("");

	const { mutate, isPending, isError } = useMutation({
		mutationFn: createOrder,
		onSuccess: async () => {
			// Placing an order changes both order history and listing stock.
			await Promise.all([
				invalidateOrdersCache(queryClient),
				invalidateListingCache(queryClient),
			]);
			showToast(
				"Order placed successfully! Please wait for seller confirmation",
				"success",
			);
			navigate({ to: "/shop" });
			clearCart();
		},
		onError: (error) => {
			clientLogger.error("Failed to place order", error);
			const message =
				error instanceof Error ? error.message : "Failed to place order";

			showToast(message, "error");
		},
	});

	const handleShippingAddressChange = (
		e: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		setShippingAddress(e.target.value);
	};

	const clearAddress = () => {
		setShippingAddress("");
	};

	const handleDefaultAddress = () => {
		if (address) {
			setShippingAddress(address);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!shippingAddress.trim()) {
			showToast("Please provide a shipping address", "error");
			return;
		}

		if (checkoutCart.status !== "ready") {
			showToast(checkoutCart.message, "error");
			return;
		}

		const orderPayload = {
			items: checkoutCart.items,
			shippingAddress,
		};

		mutate(orderPayload);
	};

	return {
		shippingAddress,
		address,
		isPending,
		isError,
		clearAddress,
		handleDefaultAddress,
		handleShippingAddressChange,
		handleSubmit,
	};
};

export default usePlaceOrder;
