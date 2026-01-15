import { productCategoryOptions } from "@/constants/selectOptions";
import { useUserStore } from "@/store/user";

interface ProductFilterBadgesProps {
	showPending: boolean;
	selectedCategory: string | null;
	onShowAll: () => void;
	onShowPending: () => void;
	onCategorySelect: (category: string) => void;
}

const ProductFilterBadges = ({
	showPending,
	selectedCategory,
	onShowAll,
	onShowPending,
	onCategorySelect,
}: ProductFilterBadgesProps) => {
	const { user } = useUserStore();
	const isAdmin = user?.role === "ADMIN";

	return (
		<div className="flex flex-wrap gap-3 my-6">
			{/* All Categories */}
			<button
				type="button"
				onClick={onShowAll}
				className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
					!showPending && selectedCategory === null
						? "bg-primary text-white border-secondary shadow-lg scale-105"
						: "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
				}`}
			>
				All
			</button>

			{/* Pending Products */}
			{isAdmin && (
				<button
					type="button"
					onClick={onShowPending}
					className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
						showPending
							? "bg-accent text-white border-accent/80 shadow-lg scale-105"
							: "bg-white text-gray-700 border-gray-300 hover:border-accent hover:bg-primary hover:text-white shadow-sm"
					}`}
				>
					Pending
				</button>
			)}

			{/* Category Filters */}
			{!showPending &&
				productCategoryOptions.map((category) => {
					const CategoryIcon = category.icon;
					const isSelected = selectedCategory === category.value;

					return (
						<button
							key={category.value}
							type="button"
							onClick={() => onCategorySelect(category.value)}
							className={`px-5 py-2 rounded-full border-2 font-medium transition-all flex items-center gap-2 ${
								isSelected
									? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
									: "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
							}`}
						>
							<CategoryIcon size={16} />
							{category.label}
						</button>
					);
				})}
		</div>
	);
};

export default ProductFilterBadges;
