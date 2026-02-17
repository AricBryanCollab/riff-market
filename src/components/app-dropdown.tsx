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
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onTriggerPointerEnter?: () => void;
	onTriggerFocus?: () => void;
}

export function AppDropdown({
	trigger,
	children,
	align = "end",
	className,
	open,
	onOpenChange,
	onTriggerPointerEnter,
	onTriggerFocus,
}: AppDropdownProps) {
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				className="cursor-pointer"
				onPointerEnter={onTriggerPointerEnter}
				onFocus={onTriggerFocus}
			>
				{trigger}
			</PopoverTrigger>
			<PopoverContent align={align} className={cn(className)}>
				{children}
			</PopoverContent>
		</Popover>
	);
}
