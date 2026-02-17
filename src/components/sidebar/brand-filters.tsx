import { Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { popularBrands } from "@/constants/popular-brands";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";

const BrandFilters = () => {
	const { searchParams, setBrand } = useShopSearchFilters();
	const selectedBrand = searchParams.brand;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Tag size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Brand
					</h3>
				</div>
				{selectedBrand && (
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
					value={selectedBrand ?? ""}
					onChange={(e) => setBrand(e.target.value || undefined)}
					className="w-full"
				/>
				<div className="text-xs text-muted-foreground">Popular brands:</div>
				<div className="flex flex-wrap gap-1.5">
					{popularBrands.map((brand) => (
						<Badge
							key={brand}
							variant={selectedBrand === brand ? "default" : "outline"}
							className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
							onClick={() =>
								setBrand(selectedBrand === brand ? undefined : brand)
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
