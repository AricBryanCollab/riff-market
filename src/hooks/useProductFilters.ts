import { useState } from "react";
import useGetProducts from "@/hooks/useGetProducts";

const useProductFilters = () => {
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const {
		productList,
		loadingProductList,
		isErrorProductList,
		showPending,
		pendingProductList,
		loadingPendingProduct,
		isErrorPendingProduct,
		setShowPending,
		refetchProductList,
	} = useGetProducts();

	const productsToDisplay = showPending ? pendingProductList : productList;

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
	};

	const handleShowAll = () => {
		setShowPending(false);
		setSelectedCategory(null);
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category);
	};

	return {
		searchTerm,
		selectedCategory,
		showPending,
		filteredProducts,
		productList,
		pendingProductList,
		isPending: loadingProductList || (loadingPendingProduct && showPending),
		isError: isErrorProductList || isErrorPendingProduct,
		handleSearchChange,
		handleCategoryChange,
		handleShowPending,
		handleShowAll,
		refetchProductList,
	};
};

export default useProductFilters;
