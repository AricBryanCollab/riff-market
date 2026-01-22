import type { CategoryMeta } from "@/types/product";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
	categories: CategoryMeta[];
}

const CategoryGrid = ({ categories }: CategoryGridProps) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{categories.map((category) => (
				<CategoryCard key={category.category} category={category} />
			))}
		</div>
	);
};

export default CategoryGrid;
