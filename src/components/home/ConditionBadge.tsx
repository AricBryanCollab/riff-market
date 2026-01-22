import type { ProductCondition } from "@/types/product";

interface ConditionBadgeProps {
	condition: ProductCondition;
}

const CONDITION_LABELS: Record<ProductCondition, string> = {
	new: "New",
	used: "Used",
	mint: "Mint",
};

const ConditionBadge = ({ condition }: ConditionBadgeProps) => {
	return (
		<span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full border border-border bg-background text-foreground">
			{CONDITION_LABELS[condition]}
		</span>
	);
};

export default ConditionBadge;
