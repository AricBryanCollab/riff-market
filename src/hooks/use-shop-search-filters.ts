import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ShopSearch } from "@/types/product";
import { getApprovedFiltersFromSearch, getShopPage } from "@/utils/shop-search";

const getOptionalString = (value?: string) => (value ? value : undefined);

const getOptionalNumber = (value?: number) =>
	typeof value === "number" && Number.isFinite(value) ? value : undefined;

const useShopSearchFilters = () => {
	const searchParams = useSearch({ from: "/shop/" });
	const navigate = useNavigate({ from: "/shop/" });

	const updateSearch = (
		updater: (previous: ShopSearch) => ShopSearch,
		replace = true,
	) => {
		navigate({
			search: (previous) => updater(previous),
			replace,
		});
	};

	const setCategory = (category?: string) => {
		updateSearch((previous) => ({
			...previous,
			category: getOptionalString(category),
			page: undefined,
		}));
	};

	const setBrand = (brand?: string) => {
		updateSearch((previous) => ({
			...previous,
			brand: getOptionalString(brand),
			page: undefined,
		}));
	};

	const setCondition = (condition?: string) => {
		updateSearch((previous) => ({
			...previous,
			condition: getOptionalString(condition),
			page: undefined,
		}));
	};

	const setSearch = (search?: string) => {
		updateSearch((previous) => ({
			...previous,
			search: getOptionalString(search),
			page: undefined,
		}));
	};

	const setPriceRange = (priceMin?: number, priceMax?: number) => {
		updateSearch((previous) => ({
			...previous,
			priceMin: getOptionalNumber(priceMin),
			priceMax: getOptionalNumber(priceMax),
			page: undefined,
		}));
	};

	const setPage = (page: number) => {
		const normalizedPage = Number.isFinite(page)
			? Math.max(0, Math.floor(page))
			: 0;

		updateSearch(
			(previous) => ({
				...previous,
				page: normalizedPage > 0 ? normalizedPage : undefined,
			}),
			false,
		);
	};

	const resetFilters = () => {
		updateSearch((previous) => ({
			...previous,
			category: undefined,
			brand: undefined,
			condition: undefined,
			search: undefined,
			priceMin: undefined,
			priceMax: undefined,
			page: undefined,
		}));
	};

	return {
		searchParams,
		approvedFilters: getApprovedFiltersFromSearch(searchParams),
		page: getShopPage(searchParams),
		setCategory,
		setBrand,
		setCondition,
		setSearch,
		setPriceRange,
		setPage,
		resetFilters,
	};
};

export default useShopSearchFilters;
