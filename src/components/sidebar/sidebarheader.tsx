import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
	isExpanded: boolean;
	toggleSidebar: () => void;
}

const SidebarHeader = ({ isExpanded, toggleSidebar }: SidebarHeaderProps) => {
	return (
		<div
			className={`flex items-center gap-3 px-4 py-2.5 border-b shrink-0 ${isExpanded ? "justify-between" : "justify-center"}`}
		>
			{isExpanded && (
				<div className="flex items-center gap-2">
					<h1 className="text-xl font-bold tracking-wide">RiffMarket</h1>
				</div>
			)}
			<Button
				variant="default"
				size="icon"
				onClick={toggleSidebar}
				aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
			>
				{isExpanded ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
			</Button>
		</div>
	);
};

export default SidebarHeader;
