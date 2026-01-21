import type { LucideIcon } from "lucide-react";

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
	backgroundColor = "bg-primary hover:bg-accent",
}: IconButtonProps) => {
	const disabledStyle = "bg-gray-300 text-gray-500 cursor-not-allowed";

	const enabledStyle = `text-background ${backgroundColor} cursor-pointer`;

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={`size-10 flex  items-center justify-center rounded-lg ${disabled ? disabledStyle : enabledStyle}  transition-colors`}
		>
			<Icon size={18} />
		</button>
	);
};

export default IconButton;
