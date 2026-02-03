import { DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useProductStore } from "@/store/products";
import type { GetApprovedProductsFilterQuery } from "@/types/product";

interface PriceRangeFiltersProps {
	filters: GetApprovedProductsFilterQuery;
}

const PriceRangeFilters = ({ filters }: PriceRangeFiltersProps) => {
	const setPriceRange = useProductStore((state) => state.setPriceRange);

	const handlePriceMinChange = (value: string) => {
		const min = value ? Number(value) : undefined;
		setPriceRange(min, filters.priceMax);
	};

	const handlePriceMaxChange = (value: string) => {
		const max = value ? Number(value) : undefined;
		setPriceRange(filters.priceMin, max);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<DollarSign size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Price Range
					</h3>
				</div>
				{(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setPriceRange(undefined, undefined)}
						className="h-6 px-2"
					>
						<X size={14} />
					</Button>
				)}
			</div>
			<div className="flex gap-2 items-center">
				<Input
					type="number"
					placeholder="Min"
					value={filters.priceMin ?? ""}
					onChange={(e) => handlePriceMinChange(e.target.value)}
					className="flex-1"
				/>
				<span className="text-muted-foreground">—</span>
				<Input
					type="number"
					placeholder="Max"
					value={filters.priceMax ?? ""}
					onChange={(e) => handlePriceMaxChange(e.target.value)}
					className="flex-1"
				/>
			</div>
			{(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
				<p className="text-xs text-muted-foreground">
					{filters.priceMin !== undefined && `$${filters.priceMin}`}
					{filters.priceMin !== undefined &&
						filters.priceMax !== undefined &&
						" - "}
					{filters.priceMax !== undefined && `$${filters.priceMax}`}
				</p>
			)}
		</div>
	);
};

export default PriceRangeFilters;
