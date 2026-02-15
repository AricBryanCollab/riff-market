import { Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { popularBrands } from "@/constants/popular-brands";
import { useProductStore } from "@/store/products";
import type { GetApprovedProductsFilterQuery } from "@/types/product";

interface BrandFiltersProps {
	filters: GetApprovedProductsFilterQuery;
}

const BrandFilters = ({ filters }: BrandFiltersProps) => {
	const setBrand = useProductStore((state) => state.setBrand);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Tag size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Brand
					</h3>
				</div>
				{filters.brand && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setBrand(undefined)}
						className="h-6 px-2"
					>
						<X size={14} />
					</Button>
				)}
			</div>
			<div className="space-y-2">
				<Input
					type="text"
					placeholder="Search brands..."
					value={filters.brand ?? ""}
					onChange={(e) => setBrand(e.target.value || undefined)}
					className="w-full"
				/>
				<div className="text-xs text-muted-foreground">Popular brands:</div>
				<div className="flex flex-wrap gap-1.5">
					{popularBrands.map((brand) => (
						<Badge
							key={brand}
							variant={filters.brand === brand ? "default" : "outline"}
							className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
							onClick={() =>
								setBrand(filters.brand === brand ? undefined : brand)
							}
						>
							{brand}
						</Badge>
					))}
				</div>
			</div>
		</div>
	);
};

export default BrandFilters;
