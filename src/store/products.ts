import { create } from "zustand";
import type { GetApprovedProcutsFilterQuery } from "@/types/product";

interface ProductStore {
	filters: GetApprovedProcutsFilterQuery;
	page: number;
	pageSize: number;
	setFilters: (filters: Partial<GetApprovedProcutsFilterQuery>) => void;
	setCategory: (category?: string) => void;
	setBrand: (brand?: string) => void;
	setCondition: (condition?: string) => void;
	setSearch: (search?: string) => void;
	setPriceRange: (priceMin?: number, priceMax?: number) => void;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
	resetFilters: () => void;
	getOffset: () => number;
}

const defaultFilters: GetApprovedProcutsFilterQuery = {
	limit: 8,
	offset: 0,
};

export const useProductStore = create<ProductStore>((set, get) => ({
	filters: defaultFilters,
	page: 0,
	pageSize: 8,

	setFilters: (newFilters) =>
		set((state) => ({
			filters: { ...state.filters, ...newFilters, offset: 0 },
			page: 0,
		})),

	setCategory: (category) =>
		set((state) => ({
			page: 0,
			filters: {
				...state.filters,
				category,
				offset: 0,
			},
		})),

	setBrand: (brand) =>
		set((state) => ({
			filters: { ...state.filters, brand, offset: 0 },
			page: 0,
		})),

	setCondition: (condition) =>
		set((state) => ({
			filters: { ...state.filters, condition, offset: 0 },
			page: 0,
		})),

	setSearch: (search) =>
		set((state) => ({
			filters: { ...state.filters, search, offset: 0 },
			page: 0,
		})),

	setPriceRange: (priceMin, priceMax) =>
		set((state) => ({
			filters: { ...state.filters, priceMin, priceMax, offset: 0 },
			page: 0,
		})),

	setPage: (page) =>
		set((state) => ({
			page,
			filters: {
				...state.filters,
				offset: page * state.pageSize,
			},
		})),
	setPageSize: (pageSize) =>
		set(() => ({
			pageSize,
			page: 0,
			filters: {
				...get().filters,
				limit: pageSize,
				offset: 0,
			},
		})),

	resetFilters: () =>
		set({
			filters: defaultFilters,
			page: 0,
			pageSize: 8,
		}),

	getOffset: () => {
		const { page, pageSize } = get();
		return page * pageSize;
	},
}));
