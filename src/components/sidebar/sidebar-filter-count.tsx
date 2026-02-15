import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SidebarFilterCount = ({
	activeFiltersCount,
}: {
	activeFiltersCount: number;
}) => {
	return (
		<div className="px-4 py-2.5 border-b bg-muted/50 shrink-0">
			<div className="flex items-center gap-2">
				<Filter size={18} className="text-muted-foreground" />
				<h2 className="font-semibold">Filters</h2>
				{activeFiltersCount > 0 && (
					<Badge variant="default" className="ml-auto">
						{activeFiltersCount}
					</Badge>
				)}
			</div>
		</div>
	);
};

export default SidebarFilterCount;
