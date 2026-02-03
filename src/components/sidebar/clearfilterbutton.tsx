import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductStore } from "@/store/products";

const ClearFilterButton = ({
	activeFiltersCount,
}: {
	activeFiltersCount: number;
}) => {
	const resetFilters = useProductStore((state) => state.resetFilters);

	return (
		<div className="px-4 py-4 border-t bg-muted/50 space-y-2 shrink-0">
			<Button
				variant="outline"
				className="w-full"
				onClick={resetFilters}
				disabled={activeFiltersCount === 0}
			>
				<X size={16} className="mr-2" />
				Clear All Filters
			</Button>
			{activeFiltersCount > 0 && (
				<p className="text-xs text-center text-muted-foreground">
					{activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
				</p>
			)}
		</div>
	);
};

export default ClearFilterButton;
