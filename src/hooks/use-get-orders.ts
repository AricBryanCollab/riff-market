import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
	getOrderByCustomer,
	getOrderBySeller,
	updateOrderStatus,
} from "@/lib/tanstack-query/orders-queries";
import { useOrderStore } from "@/store/order";
import type { OrderStatus, UserRole } from "@/types/enum";

const useGetOrders = (userRole: UserRole) => {
	const queryClient = useQueryClient();
	const orders = useOrderStore((state) => state.orders);
	const orderCount = useOrderStore((state) => state.orderCount);
	const setOrders = useOrderStore((state) => state.setOrders);
	const updateOrderInStore = useOrderStore((state) => state.updateOrder);

	const { data: user } = useAuthUser();

	const queryFn =
		userRole === "CUSTOMER" ? getOrderByCustomer : getOrderBySeller;

	const { data, isLoading } = useQuery({
		queryKey: ["orders", userRole],
		queryFn,
		staleTime: 30000,
		refetchInterval: 60000,
		enabled: user !== null,
	});

	useEffect(() => {
		if (data && !("error" in data)) {
			setOrders(data);
		}
	}, [data, setOrders]);

	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
			updateOrderStatus(id, status),
		onMutate: async ({ id, status }) => {
			const previousOrders = orders;
			const orderToUpdate = orders.find((o) => o.id === id);

			if (orderToUpdate) {
				updateOrderInStore(id, { ...orderToUpdate, status });
			}

			return { previousOrders };
		},
		onError: (err, _, context) => {
			console.error("Failed to update order status:", err);

			if (context?.previousOrders) {
				setOrders(context.previousOrders);
			}

			queryClient.invalidateQueries({ queryKey: ["orders", userRole] });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders", userRole] });
		},
	});

	const isEmptyOrders = orders.length === 0;

	return {
		orders,
		orderCount,
		isLoading,
		isEmptyOrders,
		updateStatus: updateStatusMutation.mutate,
	};
};

export default useGetOrders;
