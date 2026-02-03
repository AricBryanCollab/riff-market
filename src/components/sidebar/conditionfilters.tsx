import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { productConditionOptions } from "@/constants/selectOptions";
import { useProductStore } from "@/store/products";
import type { GetApprovedProductsFilterQuery } from "@/types/product";

interface ConditionFiltersProps {
	filters: GetApprovedProductsFilterQuery;
}

const ConditionFilters = ({ filters }: ConditionFiltersProps) => {
	const setCondition = useProductStore((state) => state.setCondition);
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Star size={16} className="text-muted-foreground" />
					<h3 className="font-semibold text-sm uppercase tracking-wide">
						Condition
					</h3>
				</div>
				{filters.condition && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setCondition(undefined)}
						className="h-6 px-2"
					>
						<X size={14} />
					</Button>
				)}
			</div>
			<div className="space-y-2">
				{productConditionOptions.map((condition) => (
					<div key={condition.value} className="flex items-center space-x-2">
						<Checkbox
							id={`condition-${condition.value}`}
							checked={filters.condition === condition.value}
							onCheckedChange={(checked) => {
								setCondition(checked ? condition.value : undefined);
							}}
						/>
						<Label
							htmlFor={`condition-${condition.value}`}
							className="text-sm font-normal cursor-pointer"
						>
							{condition.label}
						</Label>
					</div>
				))}
			</div>
		</div>
	);
};

export default ConditionFilters;
