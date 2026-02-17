import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	getOrderByCustomer,
	getOrderBySeller,
	updateOrderStatus,
} from "@/lib/tanstack-query/orders-queries";
import type { OrderStatus, UserRole } from "@/types/enum";
import type { OrderResponse } from "@/types/order";

export const ordersByRoleQueryOpt = (userRole: UserRole) => {
	const queryFn =
		userRole === "CUSTOMER" ? getOrderByCustomer : getOrderBySeller;

	return queryOptions({
		queryKey: ["orders", userRole],
		queryFn,
		staleTime: 30000,
	});
};

interface UseGetOrdersOptions {
	enabled?: boolean;
	polling?: boolean;
}

const useGetOrders = (
	userRole: UserRole,
	options: UseGetOrdersOptions = {},
) => {
	const queryClient = useQueryClient();

	const enabled = options.enabled ?? true;
	const polling = options.polling ?? true;
	const isQueryEnabled = enabled;
	const queryKey = ["orders", userRole] as const;

	const { data, isLoading } = useQuery({
		...ordersByRoleQueryOpt(userRole),
		refetchInterval: isQueryEnabled && polling ? 60000 : false,
		enabled: isQueryEnabled,
	});

	const orders = Array.isArray(data) ? data : [];
	const orderCount = orders.length;

	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
			updateOrderStatus(id, status),
		onMutate: async ({ id, status }) => {
			await queryClient.cancelQueries({ queryKey });

			const previousOrders =
				queryClient.getQueryData<OrderResponse[]>(queryKey);

			queryClient.setQueryData<OrderResponse[]>(queryKey, (currentOrders) => {
				if (!currentOrders) {
					return currentOrders;
				}

				return currentOrders.map((order) =>
					order.id === id ? { ...order, status } : order,
				);
			});

			return { previousOrders };
		},
		onError: (err, _, context) => {
			console.error("Failed to update order status:", err);

			if (context?.previousOrders) {
				queryClient.setQueryData(queryKey, context.previousOrders);
			}

			queryClient.invalidateQueries({ queryKey });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
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
