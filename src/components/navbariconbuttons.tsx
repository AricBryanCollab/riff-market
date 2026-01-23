import type { LucideIcon } from "lucide-react";

interface NavbarIconButtonsProps {
	icon: LucideIcon;
	count?: number;
	onClick?: () => void;
	ariaLabel?: string;
}

const NavbarIconButtons = ({
	icon: Icon,
	count = 0,
	onClick,
	ariaLabel,
}: NavbarIconButtonsProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
			className="relative cursor-pointer hover:bg-accent/20 rounded-full p-1"
		>
			<Icon size={24} className="text-primary" />
			{count > 0 && (
				<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
					<span className="text-xs font-semibold text-white leading-none">
						{count > 9 ? "9+" : count}
					</span>
				</div>
			)}
		</button>
	);
};

export default NavbarIconButtons;
