import { create } from "zustand";
import type { OrderResponse } from "@/types/order";

interface OrderStore {
	orders: OrderResponse[];
	setOrders: (orders: OrderResponse[]) => void;
	addOrder: (order: OrderResponse) => void;
	updateOrder: (id: string, updatedOrder: OrderResponse) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
	orders: [],

	setOrders: (orders) =>
		set({
			orders,
		}),

	addOrder: (order) =>
		set((state) => ({
			orders: [order, ...state.orders],
		})),

	updateOrder: (id, updatedOrder) =>
		set((state) => ({
			orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
		})),
}));
