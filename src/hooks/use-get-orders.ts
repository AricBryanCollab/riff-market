import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { SelfAssignableRole } from "@/domains/accounts/application/account-auth";
import { clientLogger } from "@/lib/client-logger";
import {
	getOrderByCustomer,
	getOrderBySeller,
	updateOrderStatus,
} from "@/lib/tanstack-query/orders-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import type { OrderStatus } from "@/types/enum";
import type { OrderResponse } from "@/types/order";

export type OrderQueryRole = SelfAssignableRole;
export type UpdateOrderStatusInput = {
	id: string;
	status: OrderStatus;
	trackingNumber?: string | null;
};

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
		mutationFn: ({ id, status, trackingNumber }: UpdateOrderStatusInput) =>
			updateOrderStatus(id, status, trackingNumber),
		onMutate: async ({ id, status, trackingNumber }) => {
			await queryClient.cancelQueries({ queryKey });

			const previousOrders =
				queryClient.getQueryData<OrderResponse[]>(queryKey);

			queryClient.setQueryData<OrderResponse[]>(queryKey, (currentOrders) => {
				if (!currentOrders) {
					return currentOrders;
				}

				return currentOrders.map((order) =>
					order.id === id
						? {
								...order,
								status,
								trackingNumber: trackingNumber ?? order.trackingNumber,
							}
						: order,
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
