import { DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";

const getPriceValue = (value: string): number | undefined => {
	if (!value) {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const PriceRangeFilters = () => {
	const { searchParams, setPriceRange } = useShopSearchFilters();

	const handlePriceMinChange = (value: string) => {
		const min = getPriceValue(value);
		setPriceRange(min, searchParams.priceMax);
	};

	const handlePriceMaxChange = (value: string) => {
		const max = getPriceValue(value);
		setPriceRange(searchParams.priceMin, max);
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
				{(searchParams.priceMin !== undefined ||
					searchParams.priceMax !== undefined) && (
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
					value={searchParams.priceMin ?? ""}
					onChange={(e) => handlePriceMinChange(e.target.value)}
					className="flex-1"
				/>
				<span className="text-muted-foreground">—</span>
				<Input
					type="number"
					placeholder="Max"
					value={searchParams.priceMax ?? ""}
					onChange={(e) => handlePriceMaxChange(e.target.value)}
					className="flex-1"
				/>
			</div>
			{(searchParams.priceMin !== undefined ||
				searchParams.priceMax !== undefined) && (
				<p className="text-xs text-muted-foreground">
					{searchParams.priceMin !== undefined && `$${searchParams.priceMin}`}
					{searchParams.priceMin !== undefined &&
						searchParams.priceMax !== undefined &&
						" - "}
					{searchParams.priceMax !== undefined && `$${searchParams.priceMax}`}
				</p>
			)}
		</div>
	);
};

export default PriceRangeFilters;
