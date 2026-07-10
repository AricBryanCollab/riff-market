import { Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { listingCategoryOptions } from "@/constants/select-options";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";

const CategoryFilters = () => {
	const { searchParams, setCategory } = useShopSearchFilters();
	const selectedCategory = searchParams.category;
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Package size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Category
					</h3>
				</div>
				{selectedCategory && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setCategory(undefined)}
						className="h-6 px-2"
					>
						<X size={14} />
					</Button>
				)}
			</div>
			<div className="space-y-2">
				{listingCategoryOptions.map((category) => (
					<div key={category.value} className="flex items-center space-x-2">
						<Checkbox
							id={`category-${category.value}`}
							checked={selectedCategory === category.value}
							onCheckedChange={(checked) => {
								setCategory(checked ? category.value : undefined);
							}}
						/>
						<Label
							htmlFor={`category-${category.value}`}
							className="text-sm font-normal cursor-pointer flex items-center gap-2"
						>
							{category.label}
						</Label>
					</div>
				))}
			</div>
		</div>
	);
};

export default CategoryFilters;
