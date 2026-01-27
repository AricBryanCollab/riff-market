import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AppDropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	className?: string;
}

export function AppDropdown({
	trigger,
	children,
	align = "end",
	className,
}: AppDropdownProps) {
	return (
		<Popover>
			<PopoverTrigger className="cursor-pointer">{trigger}</PopoverTrigger>
			<PopoverContent align={align} className={cn(className)}>
				{children}
			</PopoverContent>
		</Popover>
	);
}
