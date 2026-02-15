import { CategoryGridEmpty } from "@/components/emptystates";
import { CategoryGridError } from "@/components/errorstates";
import CategoryCard from "@/components/home/category-card";
import { CategoryGridLoading } from "@/components/loadingstates";
import useGetProductCount from "@/hooks/use-get-product-count";

const CategoryGrid = () => {
	const {
		categoryCounts,
		loadingCategoryCounts,
		isErrorCategoryCounts,
		refetchCategoryCounts,
	} = useGetProductCount();

	if (loadingCategoryCounts) {
		return <CategoryGridLoading />;
	}

	if (isErrorCategoryCounts) {
		return <CategoryGridError refetch={refetchCategoryCounts} />;
	}

	if (!categoryCounts || categoryCounts.length === 0) {
		return <CategoryGridEmpty />;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{categoryCounts.map((category) => (
				<CategoryCard key={category.category} category={category} />
			))}
		</div>
	);
};

export default CategoryGrid;
