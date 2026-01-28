import { create } from "zustand";
import type { OrderResponse } from "@/types/order";

interface OrderStore {
	orders: OrderResponse[];
	orderCount: number;
	setOrders: (orders: OrderResponse[]) => void;
	addOrder: (order: OrderResponse) => void;
	updateOrder: (id: string, updatedOrder: OrderResponse) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
	orders: [],
	orderCount: 0,
	setOrders: (orders) =>
		set({
			orders,
			orderCount: orders.length,
		}),

	addOrder: (order) =>
		set((state) => ({
			orders: [order, ...state.orders],
			orderCount: state.orderCount + 1,
		})),

	updateOrder: (id, updatedOrder) =>
		set((state) => ({
			orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
		})),
}));
