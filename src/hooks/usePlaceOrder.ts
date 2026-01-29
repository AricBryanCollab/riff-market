import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createOrder } from "@/lib/tanstack-query/orders.queries";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";
import type { PaymentMethod } from "@/types/enum";
import type { OrderItem } from "@/types/order";

const usePlaceOrder = () => {
	const { items: cartItems, clearCart } = useCartStore();
	const address = useUserStore((state) => state.user?.address);
	const { showToast } = useToastStore();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [orderItem, setOrderItem] = useState<OrderItem[]>([]);
	const [shippingAddress, setShippingAddress] = useState<string>("");
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
		null,
	);

	useEffect(() => {
		setOrderItem(cartItems);
	}, [cartItems]);

	const { mutate, isPending, isError } = useMutation({
		mutationFn: createOrder,
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["product"] });
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
		return;
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

		if (orderItem.length === 0) {
			showToast("Your cart is empty", "error");
			return;
		}
		const orderPayload = {
			items: [...orderItem],
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
