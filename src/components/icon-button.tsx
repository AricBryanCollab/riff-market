import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
	"size-10 flex items-center justify-center rounded-lg transition-colors",
	{
		variants: {
			disabled: {
				true: "bg-gray-300 text-gray-500 cursor-not-allowed",
				false: "cursor-pointer text-background",
			},
		},
		defaultVariants: {
			disabled: false,
		},
	},
);

interface IconButtonProps {
	icon: LucideIcon;
	onClick: () => void;
	disabled?: boolean;
	backgroundColor?: string;
}

const IconButton = ({
	onClick,
	icon: Icon,
	disabled = false,
	backgroundColor = "bg-primary hover:bg-accent hover:text-primary",
}: IconButtonProps) => {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				iconButtonVariants({ disabled }),
				!disabled && backgroundColor,
			)}
		>
			<Icon size={18} />
		</button>
	);
};

export default IconButton;
