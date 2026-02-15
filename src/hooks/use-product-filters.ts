import { useEffect } from "react";
import { useProductStore } from "@/store/products";
import type { ShopSearch } from "@/types/product";

const useProductFilters = (searchParams: ShopSearch) => {
	const { setFilters, setPage } = useProductStore();
	useEffect(() => {
		const { category, brand, condition, search, priceMin, priceMax, page } =
			searchParams;

		if (
			category ||
			brand ||
			condition ||
			search ||
			priceMin ||
			priceMax ||
			page
		) {
			setFilters({
				category,
				brand,
				condition,
				search,
				priceMin,
				priceMax,
			});
			if (page !== undefined) {
				setPage(page);
			}
		}
	}, [searchParams, setFilters, setPage]);
	return {};
};

export default useProductFilters;
