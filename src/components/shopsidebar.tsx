import { cva } from "class-variance-authority";
import { Filter } from "lucide-react";

import BrandFilters from "@/components/sidebar/brandfilters";
import CategoryFilters from "@/components/sidebar/categoryfilters";
import ClearFilterButton from "@/components/sidebar/clearfilterbutton";
import ConditionFilters from "@/components/sidebar/conditionfilters";
import PriceRangeFilters from "@/components/sidebar/pricerangefilters";
import SidebarFilterCount from "@/components/sidebar/sidebarfiltercount";
import SidebarHeader from "@/components/sidebar/sidebarheader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProductStore } from "@/store/products";
import { useSidebarStore } from "@/store/sidebar";

const shopSidebarVariants = cva(
	"shrink-0 border-r bg-background fixed z-50 h-screen overflow-hidden transition-all duration-300 ease-in-out",
	{
		variants: {
			isExpanded: {
				true: "w-80",
				false: "w-16",
			},
		},
		defaultVariants: {
			isExpanded: false,
		},
	},
);

const ShopSidebar = () => {
	const { isExpanded, toggleSidebar } = useSidebarStore();

	const filters = useProductStore((state) => state.filters);

	const activeFiltersCount =
		(filters.category ? 1 : 0) +
		(filters.condition ? 1 : 0) +
		(filters.brand ? 1 : 0) +
		(filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0);

	return (
		<aside
			className={shopSidebarVariants({
				isExpanded,
			})}
		>
			<SidebarHeader isExpanded={isExpanded} toggleSidebar={toggleSidebar} />

			{isExpanded && (
				<section className="flex flex-col h-[calc(100vh-89px)]">
					<SidebarFilterCount activeFiltersCount={activeFiltersCount} />
					<ScrollArea className="flex-1 h-0 min-h-0">
						<div className="px-4 py-4 space-y-6">
							<CategoryFilters filters={filters} />

							<Separator />

							<PriceRangeFilters filters={filters} />

							<Separator />

							<ConditionFilters filters={filters} />

							<Separator />

							<BrandFilters filters={filters} />
						</div>
					</ScrollArea>

					<ClearFilterButton activeFiltersCount={activeFiltersCount} />
				</section>
			)}

			{!isExpanded && (
				<div className="flex flex-col items-center gap-6 mt-6">
					<Button
						variant="ghost"
						size="icon"
						className="relative"
						title="Filters"
					>
						<Filter size={20} />
						{activeFiltersCount > 0 && (
							<Badge
								variant="default"
								className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
							>
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				</div>
			)}
		</aside>
	);
};

export default ShopSidebar;
