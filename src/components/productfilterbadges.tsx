import type { ProductCategory } from "generated/prisma/enums";
import { productCategoryOptions } from "@/constants/selectOptions";
import { useProductStore } from "@/store/products";
import { useUserStore } from "@/store/user";

const ProductFilterBadges = () => {
	const { user } = useUserStore();
	const isAdmin = user?.role === "ADMIN";

	const { filters, setCategory, resetFilters } = useProductStore();

	const selectedCategory = filters.category;

	const handleShowAll = () => {
		resetFilters();
	};

	const handleCategorySelect = (category: ProductCategory) => {
		if (selectedCategory === category) {
			setCategory(undefined);
		} else {
			setCategory(category);
		}
	};

	const showPending = true;

	return (
		<div className="flex flex-wrap gap-3 my-6">
			{/* All Categories */}
			<button
				type="button"
				onClick={handleShowAll}
				className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
					!selectedCategory
						? "bg-primary text-white border-secondary shadow-lg scale-105"
						: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
				}`}
			>
				All
			</button>

			{/* Pending Products */}
			{isAdmin && (
				<button
					type="button"
					onClick={() => {}}
					className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
						showPending
							? "bg-primary text-white border-secondary shadow-lg scale-105"
							: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
					}`}
				>
					Pending
				</button>
			)}

			{/* Category Filters */}
			{productCategoryOptions.map((category) => {
				const isSelected = selectedCategory === category.value;

				return (
					<button
						key={category.value}
						type="button"
						onClick={() => handleCategorySelect(category.value)}
						className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
							isSelected
								? "bg-primary text-white border-secondary shadow-lg scale-105"
								: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
						}`}
					>
						{category.label}
					</button>
				);
			})}
		</div>
	);
};

export default ProductFilterBadges;
