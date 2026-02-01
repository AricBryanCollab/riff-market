import { useState } from "react";
import useGetPendingProducts from "@/hooks/useGetPendingProducts";
import useShopPagination from "@/hooks/useShopPagination";

const useProductFilters = () => {
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [showPending, setShowPending] = useState<boolean>(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const {
		productList,
		loadingProductList,
		isErrorProductList,
		page,
		pageSize,
		hasProducts,
		isFirstPage,
		isLastPage,
		refetchProductList,
		nextPage,
		previousPage,
		goToPage,
	} = useShopPagination();

	const {
		pendingProducts,
		isLoading: isLoadingPendingProduct,
		isError: isErrorPendingProduct,
	} = useGetPendingProducts(showPending);

	const productsToDisplay = showPending ? pendingProducts : productList;

	const filteredProducts =
		productsToDisplay?.filter((product) => {
			const query = searchTerm.toLowerCase();
			const matchesSearch =
				product.name.toLowerCase().includes(query) ||
				product.brand.toLowerCase().includes(query) ||
				product.model.toLowerCase().includes(query);

			const matchesCategory = selectedCategory
				? product.category === selectedCategory
				: true;

			return matchesSearch && matchesCategory;
		}) || [];

	const handleShowPending = () => {
		setShowPending(true);
		setSelectedCategory(null);
		goToPage(0);
	};

	const handleShowAll = () => {
		setShowPending(false);
		setSelectedCategory(null);
		goToPage(0);
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		goToPage(0);
	};

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category);
		goToPage(0);
	};

	return {
		searchTerm,
		selectedCategory,
		filteredProducts,
		productList,
		showPending,
		isLoadingPendingProduct,
		isPending: loadingProductList || (isLoadingPendingProduct && showPending),
		isError: isErrorProductList || isErrorPendingProduct,
		page,
		pageSize,
		hasProducts,
		isFirstPage,
		isLastPage,
		nextPage,
		previousPage,
		goToPage,
		handleSearchChange,
		handleCategoryChange,
		handleShowPending,
		handleShowAll,
		refetchProductList,
	};
};

export default useProductFilters;
