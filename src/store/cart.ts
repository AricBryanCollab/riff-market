import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isActorRole } from "@/domains/shared/domain/actor";
import { clientLogger } from "@/lib/client-logger";
import type { UserRole } from "@/types/enum";

export interface CartItem {
	listingId: string;
	quantity: number;
}

interface CartState {
	items: CartItem[];
	userId: string | null;
	userRole: UserRole | null;
	addItem: (
		listingId: string,
		userId: string,
		userRole: UserRole,
		quantity?: number,
	) => void;
	removeItem: (listingId: string) => void;
	updateQuantity: (listingId: string, quantity: number) => void;
	clearCart: () => void;
}

export const useCartStore = create<CartState>()(
	persist(
		(set) => ({
			items: [],
			userId: null,
			userRole: null,

			addItem: (listingId, userId, userRole, quantity = 1) =>
				set((state) => {
					if (userRole !== "CUSTOMER") {
						clientLogger.warn("Only CUSTOMER users can add items to cart");
						return state;
					}

					if (state.userId && state.userId !== userId) {
						return {
							items: [{ listingId, quantity }],
							userId,
							userRole,
						};
					}

					const existingItem = state.items.find(
						(item) => item.listingId === listingId,
					);

					if (existingItem) {
						return {
							...state,
							userId,
							userRole,
							items: state.items.map((item) =>
								item.listingId === listingId
									? { ...item, quantity: item.quantity + quantity }
									: item,
							),
						};
					}

					return {
						...state,
						userId,
						userRole,
						items: [...state.items, { listingId, quantity }],
					};
				}),

			removeItem: (listingId) =>
				set((state) => ({
					items: state.items.filter((item) => item.listingId !== listingId),
				})),

			updateQuantity: (listingId, quantity) =>
				set((state) => ({
					items: state.items.map((item) =>
						item.listingId === listingId ? { ...item, quantity } : item,
					),
				})),

			clearCart: () => set({ items: [], userId: null, userRole: null }),
		}),
		{
			name: "cart",
			merge: (persistedState, currentState) => ({
				...currentState,
				...normalizePersistedCartState(persistedState),
			}),
		},
	),
);

function normalizePersistedCartState(
	persistedState: unknown,
): Pick<CartState, "items" | "userId" | "userRole"> {
	if (!isRecord(persistedState)) {
		return { items: [], userId: null, userRole: null };
	}

	return {
		items: normalizePersistedItems(persistedState.items),
		userId:
			typeof persistedState.userId === "string" ? persistedState.userId : null,
		userRole: isUserRole(persistedState.userRole)
			? persistedState.userRole
			: null,
	};
}

function normalizePersistedItems(items: unknown): CartItem[] {
	if (!Array.isArray(items)) {
		return [];
	}

	return items.flatMap((item) => {
		if (!isRecord(item)) {
			return [];
		}

		const listingId = getPersistedListingId(item);
		const quantity = normalizePersistedQuantity(item.quantity);

		return listingId && quantity ? [{ listingId, quantity }] : [];
	});
}

function getPersistedListingId(item: Record<string, unknown>) {
	if (typeof item.listingId === "string" && item.listingId.length > 0) {
		return item.listingId;
	}

	return null;
}

function normalizePersistedQuantity(quantity: unknown) {
	if (
		typeof quantity !== "number" ||
		!Number.isSafeInteger(quantity) ||
		quantity < 1
	) {
		return null;
	}

	return quantity;
}

function isUserRole(value: unknown): value is UserRole {
	return typeof value === "string" && isActorRole(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
