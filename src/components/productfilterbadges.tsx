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
						: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
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
							? "bg-primary text-white border-secondary shadow-lg scale-105"
							: "bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm"
					}`}
				>
					Pending
				</button>
			)}

			{/* Category Filters */}
			{!showPending &&
				productCategoryOptions.map((category) => {
					const isSelected = selectedCategory === category.value;

					return (
						<button
							key={category.value}
							type="button"
							onClick={() => onCategorySelect(category.value)}
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
