import { Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { productCategoryOptions } from "@/constants/select-options";

import { useProductStore } from "@/store/products";
import type { GetApprovedProductsFilterQuery } from "@/types/product";

interface CategoryFiltersProps {
	filters: GetApprovedProductsFilterQuery;
}

const CategoryFilters = ({ filters }: CategoryFiltersProps) => {
	const setCategory = useProductStore((state) => state.setCategory);
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Package size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Category
					</h3>
				</div>
				{filters.category && (
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
				{productCategoryOptions.map((category) => (
					<div key={category.value} className="flex items-center space-x-2">
						<Checkbox
							id={`category-${category.value}`}
							checked={filters.category === category.value}
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
