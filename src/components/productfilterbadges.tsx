import type { ProductCategory } from "generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { productCategoryOptions } from "@/constants/selectOptions";
import { usePendingProductStore } from "@/store/pendingproduct";
import { useProductStore } from "@/store/products";
import { useUserStore } from "@/store/user";

const ProductFilterBadges = () => {
	const { user } = useUserStore();
	const isAdmin = user?.role === "ADMIN";

	const { filters, setCategory, resetFilters } = useProductStore();
	const { showPending, setShowPending } = usePendingProductStore();
	const selectedCategory = filters.category;

	const handleShowAll = () => {
		resetFilters();
		if (showPending) {
			setShowPending();
		}
	};

	const handleCategorySelect = (category: ProductCategory) => {
		if (selectedCategory === category) {
			setCategory(undefined);
		} else {
			setCategory(category);
		}
		if (showPending) {
			setShowPending();
		}
	};

	const handlePendingProduct = () => {
		setShowPending();
		if (!showPending && selectedCategory) {
			setCategory(undefined);
		}
	};

	return (
		<div className="flex flex-wrap gap-3 my-6">
			{/* All Categories */}
			<Badge
				onClick={handleShowAll}
				className={`px-5 py-4 rounded-full border-2 font-medium transition-all ${
					!selectedCategory && !showPending
						? "bg-primary text-white border-secondary shadow-lg scale-105"
						: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
				}`}
			>
				All
			</Badge>

			{/* Pending Products */}
			{isAdmin && (
				<Badge
					onClick={handlePendingProduct}
					className={`px-5 py-4 rounded-full border-2 font-medium transition-all ${
						showPending
							? "bg-primary text-white border-secondary shadow-lg scale-105"
							: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
					}`}
				>
					Pending
				</Badge>
			)}

			{/* Category Filters */}
			{productCategoryOptions.map((category) => {
				const isSelected = selectedCategory === category.value;

				return (
					<Badge
						key={category.value}
						onClick={() => handleCategorySelect(category.value)}
						className={`px-5 py-4 rounded-full border-2 font-medium transition-all ${
							isSelected
								? "bg-primary text-white border-secondary shadow-lg scale-105"
								: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
						}`}
					>
						{category.label}
					</Badge>
				);
			})}
		</div>
	);
};

export default ProductFilterBadges;
