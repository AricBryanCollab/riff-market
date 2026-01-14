import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { pendingProductsQueryOpt, productsQueryOpt } from "@/routes/shop/route";

const useProductFilters = () => {
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [showPending, setShowPending] = useState(false);

	const {
		data: productList,
		isPending,
		isError,
		refetch,
	} = useQuery(productsQueryOpt);

	const {
		data: pendingProductList,
		isPending: isPendingProduct,
		isError: isPendingProductError,
	} = useQuery({ ...pendingProductsQueryOpt, enabled: showPending });

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
		isPending: isPending || (isPendingProduct && showPending),
		isError: isError || isPendingProductError,
		handleSearchChange,
		handleCategoryChange,
		handleShowPending,
		handleShowAll,
		refetch,
	};
};

export default useProductFilters;
