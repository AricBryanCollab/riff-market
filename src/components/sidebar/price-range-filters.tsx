import { Banknote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MARKETPLACE_CURRENCY_CODE } from "@/domains/shared/domain/currency";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";
import { parseOptionalListingPriceSearchInput } from "@/utils/shop-search";

const formatPriceInput = (priceInput: string) =>
	`${priceInput} ${MARKETPLACE_CURRENCY_CODE}`;

const PriceRangeFilters = () => {
	const { searchParams, setPriceRange } = useShopSearchFilters();
	const [priceMinDraft, setPriceMinDraft] = useState(
		searchParams.priceMin ?? "",
	);
	const [priceMaxDraft, setPriceMaxDraft] = useState(
		searchParams.priceMax ?? "",
	);
	const [priceMinError, setPriceMinError] = useState<string | null>(null);
	const [priceMaxError, setPriceMaxError] = useState<string | null>(null);

	useEffect(() => {
		setPriceMinDraft(searchParams.priceMin ?? "");
		setPriceMinError(null);
	}, [searchParams.priceMin]);

	useEffect(() => {
		setPriceMaxDraft(searchParams.priceMax ?? "");
		setPriceMaxError(null);
	}, [searchParams.priceMax]);

	const handlePriceMinChange = (value: string) => {
		const result = parseOptionalListingPriceSearchInput(value);
		setPriceMinDraft(value);

		if (result.status === "invalid") {
			setPriceMinError(result.message);
			return;
		}

		setPriceMinError(null);
		setPriceRange(
			result.status === "valid" ? result.value : undefined,
			searchParams.priceMax,
		);
	};

	const handlePriceMaxChange = (value: string) => {
		const result = parseOptionalListingPriceSearchInput(value);
		setPriceMaxDraft(value);

		if (result.status === "invalid") {
			setPriceMaxError(result.message);
			return;
		}

		setPriceMaxError(null);
		setPriceRange(
			searchParams.priceMin,
			result.status === "valid" ? result.value : undefined,
		);
	};

	const clearPriceRange = () => {
		setPriceMinDraft("");
		setPriceMaxDraft("");
		setPriceMinError(null);
		setPriceMaxError(null);
		setPriceRange(undefined, undefined);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Banknote size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Price Range
					</h3>
				</div>
				{(searchParams.priceMin !== undefined ||
					searchParams.priceMax !== undefined) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearPriceRange}
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
					value={priceMinDraft}
					onChange={(e) => handlePriceMinChange(e.target.value)}
					min={0}
					step={1}
					aria-invalid={priceMinError !== null}
					className="flex-1"
				/>
				<span className="text-muted-foreground">—</span>
				<Input
					type="number"
					placeholder="Max"
					value={priceMaxDraft}
					onChange={(e) => handlePriceMaxChange(e.target.value)}
					min={0}
					step={1}
					aria-invalid={priceMaxError !== null}
					className="flex-1"
				/>
			</div>
			{(priceMinError || priceMaxError) && (
				<p className="text-xs text-destructive">
					{priceMinError ?? priceMaxError}
				</p>
			)}
			{(searchParams.priceMin !== undefined ||
				searchParams.priceMax !== undefined) && (
				<p className="text-xs text-muted-foreground">
					{searchParams.priceMin !== undefined &&
						formatPriceInput(searchParams.priceMin)}
					{searchParams.priceMin !== undefined &&
						searchParams.priceMax !== undefined &&
						" - "}
					{searchParams.priceMax !== undefined &&
						formatPriceInput(searchParams.priceMax)}
				</p>
			)}
		</div>
	);
};

export default PriceRangeFilters;
