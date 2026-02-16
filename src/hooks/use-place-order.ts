import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { createOrder } from "@/lib/tanstack-query/orders-queries";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import type { PaymentMethod } from "@/types/enum";

const usePlaceOrder = () => {
	const cartItems = useCartStore((state) => state.items);
	const clearCart = useCartStore((state) => state.clearCart);
	const { data: user } = useAuthUser();
	const address = user?.address ?? null;
	const showToast = useToastStore((state) => state.showToast);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [shippingAddress, setShippingAddress] = useState<string>("");
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
		null,
	);

	const { mutate, isPending, isError } = useMutation({
		mutationFn: createOrder,
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			showToast(
				"Order placed successfully! Please wait for seller confirmation",
				"success",
			);
			navigate({ to: "/shop" });
			clearCart();
		},
		onError: (error) => {
			console.error(error);
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

	const handlePaymentMethodChange = (value: string) => {
		setPaymentMethod(value as PaymentMethod);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!shippingAddress.trim()) {
			showToast("Please provide a shipping address", "error");
			return;
		}

		if (!paymentMethod) {
			showToast("Please select a payment method", "error");
			return;
		}

		if (cartItems.length === 0) {
			showToast("Your cart is empty", "error");
			return;
		}

		const orderPayload = {
			items: cartItems,
			shippingAddress,
			paymentMethod,
		};

		mutate(orderPayload);
	};

	return {
		shippingAddress,
		paymentMethod,
		address,
		isPending,
		isError,
		clearAddress,
		handleDefaultAddress,
		handleShippingAddressChange,
		handlePaymentMethodChange,
		handleSubmit,
	};
};

export default usePlaceOrder;
