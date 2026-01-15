import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
	icon: LucideIcon;
	onClick: () => void;
	backgroundColor?: string;
}

const IconButton = ({
	onClick,
	icon: Icon,
	backgroundColor = "bg-primary hover:bg-accent",
}: IconButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`size-10 flex items-center justify-center rounded-lg text-background ${backgroundColor}  transition-colors`}
		>
			<Icon size={18} />
		</button>
	);
};

export default IconButton;
