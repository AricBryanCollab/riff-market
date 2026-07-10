import { cva } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { listingCategoryOptions } from "@/constants/select-options";
import { useAuthUser } from "@/hooks/use-auth-user";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";
import { usePendingListingStore } from "@/store/pending-listing";
import type { ListingCategory } from "@/types/enum";

const listingFilterBadgeVariants = cva(
	"px-5 py-4 rounded-full border-2 font-medium transition-all",
	{
		variants: {
			active: {
				true: "bg-primary text-white border-secondary shadow-lg scale-105",
				false:
					"bg-white text-black border-gray-300 hover:border-primary hover:bg-accent hover:text-accent-foreground shadow-sm",
			},
		},
		defaultVariants: {
			active: false,
		},
	},
);

const ListingFilterBadges = () => {
	const { data: user } = useAuthUser();
	const isAdmin = user?.role === "ADMIN";

	const { searchParams, setCategory, resetFilters } = useShopSearchFilters();
	const { showPending, setShowPending } = usePendingListingStore();
	const selectedCategory = searchParams.category;

	const handleShowAll = () => {
		resetFilters();
		if (showPending) {
			setShowPending();
		}
	};

	const handleCategorySelect = (category: ListingCategory) => {
		if (selectedCategory === category) {
			setCategory(undefined);
		} else {
			setCategory(category);
		}
		if (showPending) {
			setShowPending();
		}
	};

	const handlePendingListing = () => {
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
				className={listingFilterBadgeVariants({
					active: !selectedCategory && !showPending,
				})}
			>
				All
			</Badge>

			{/* Pending Listings */}
			{isAdmin && (
				<Badge
					onClick={handlePendingListing}
					className={listingFilterBadgeVariants({
						active: showPending,
					})}
				>
					Pending
				</Badge>
			)}

			{/* Category Filters */}
			{listingCategoryOptions.map((category) => {
				const isSelected = selectedCategory === category.value;

				return (
					<Badge
						key={category.value}
						onClick={() => handleCategorySelect(category.value)}
						className={listingFilterBadgeVariants({
							active: isSelected,
						})}
					>
						{category.label}
					</Badge>
				);
			})}
		</div>
	);
};

export default ListingFilterBadges;
