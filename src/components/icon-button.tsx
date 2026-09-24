import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
	"size-10 flex items-center justify-center rounded-lg transition-[background-color,color,scale] active:not-disabled:scale-[0.96]",
	{
		variants: {
			disabled: {
				true: "bg-muted text-muted-foreground cursor-not-allowed",
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
	label: string;
	onClick: () => void;
	disabled?: boolean;
	backgroundColor?: string;
}

const IconButton = ({
	onClick,
	icon: Icon,
	label,
	disabled = false,
	backgroundColor = "bg-primary hover:bg-accent hover:text-primary",
}: IconButtonProps) => {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			aria-label={label}
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
