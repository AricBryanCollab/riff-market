import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { clientLogger } from "@/lib/client-logger";
import {
	getOrderByCustomer,
	getOrderBySeller,
	updateOrderStatus,
} from "@/lib/tanstack-query/orders-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import type { OrderStatus, UserRole } from "@/types/enum";
import type { OrderResponse } from "@/types/order";

export type OrderQueryRole = Extract<UserRole, "CUSTOMER" | "SELLER">;

export const ordersByRoleQueryOpt = (userRole: OrderQueryRole) => {
	const queryFn =
		userRole === "CUSTOMER" ? getOrderByCustomer : getOrderBySeller;

	return queryOptions({
		queryKey: queryKeys.orders.byRole(userRole),
		queryFn,
		staleTime: 30000,
	});
};

interface UseOrdersByRoleOptions {
	polling?: boolean;
}

export const useOrdersByRole = (
	userRole: OrderQueryRole,
	options: UseOrdersByRoleOptions = {},
) => {
	const polling = options.polling ?? true;

	const { data, isLoading, isError } = useQuery({
		...ordersByRoleQueryOpt(userRole),
		refetchInterval: polling ? 60000 : false,
	});

	const orders = Array.isArray(data) ? data : [];
	const orderCount = orders.length;
	const isEmptyOrders = orders.length === 0;

	return {
		orders,
		orderCount,
		isLoading,
		isError,
		isEmptyOrders,
	};
};

export const useUpdateOrderStatus = (userRole: OrderQueryRole) => {
	const queryClient = useQueryClient();
	const queryKey = queryKeys.orders.byRole(userRole);

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
			clientLogger.error("Failed to update order status", err);

			if (context?.previousOrders) {
				queryClient.setQueryData(queryKey, context.previousOrders);
			}

			queryClient.invalidateQueries({ queryKey });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	return {
		updateStatus: updateStatusMutation.mutate,
		isUpdatingStatus: updateStatusMutation.isPending,
		isUpdateStatusError: updateStatusMutation.isError,
	};
};

export default useOrdersByRole;
