import { create } from "zustand";
import type { BaseProduct } from "@/types/product";

interface PendingProductStore {
	pendingProducts: BaseProduct[];
	pendingProductCount: number;
	showPending: boolean;
	setPendingProducts: (products: BaseProduct[]) => void;
	setShowPending: () => void;
	addPendingProduct: (product: BaseProduct) => void;
	removePendingProduct: (productId: string) => void;
	updatePendingProduct: (id: string, updatedProduct: BaseProduct) => void;
}

export const usePendingProductStore = create<PendingProductStore>((set) => ({
	pendingProducts: [],
	pendingProductCount: 0,
	showPending: false,

	setPendingProducts: (products) =>
		set({
			pendingProducts: products,
			pendingProductCount: products.length,
		}),

	setShowPending: () => set((state) => ({ showPending: !state.showPending })),

	addPendingProduct: (product) =>
		set((state) => ({
			pendingProducts: [product, ...state.pendingProducts],
			pendingProductCount: state.pendingProductCount + 1,
		})),

	removePendingProduct: (productId) =>
		set((state) => ({
			pendingProducts: state.pendingProducts.filter((p) => p.id !== productId),
			pendingProductCount: state.pendingProductCount - 1,
		})),

	updatePendingProduct: (id, updatedProduct) =>
		set((state) => ({
			pendingProducts: state.pendingProducts.map((p) =>
				p.id === id ? updatedProduct : p,
			),
		})),
}));
