import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/types/enum";

interface CartItem {
	productId: string;
	quantity: number;
}

interface CartState {
	items: CartItem[];
	userId: string | null;
	userRole: UserRole | null;
	addItem: (
		productId: string,
		userId: string,
		userRole: UserRole,
		quantity?: number,
	) => void;
	removeItem: (productId: string) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	clearCart: () => void;
}

export const useCartStore = create<CartState>()(
	persist(
		(set) => ({
			items: [],
			userId: null,
			userRole: null,

			addItem: (productId, userId, userRole, quantity = 1) =>
				set((state) => {
					if (userRole !== "CUSTOMER") {
						console.warn("Only CUSTOMER users can add items to cart");
						return state;
					}

					if (state.userId && state.userId !== userId) {
						return {
							items: [{ productId, quantity }],
							userId,
							userRole,
						};
					}

					const existingItem = state.items.find(
						(item) => item.productId === productId,
					);

					if (existingItem) {
						return {
							...state,
							userId,
							userRole,
							items: state.items.map((item) =>
								item.productId === productId
									? { ...item, quantity: item.quantity + quantity }
									: item,
							),
						};
					}

					return {
						...state,
						userId,
						userRole,
						items: [...state.items, { productId, quantity }],
					};
				}),

			removeItem: (productId) =>
				set((state) => ({
					items: state.items.filter((item) => item.productId !== productId),
				})),

			updateQuantity: (productId, quantity) =>
				set((state) => ({
					items: state.items.map((item) =>
						item.productId === productId ? { ...item, quantity } : item,
					),
				})),

			clearCart: () => set({ items: [], userId: null, userRole: null }),
		}),
		{
			name: "cart",
		},
	),
);
