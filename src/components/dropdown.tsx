import { useEffect, useRef, useState } from "react";

interface DropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	align?: "left" | "right";
	className?: string;
}

const Dropdown = ({
	trigger,
	children,
	align = "right",
	className = "",
}: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div ref={dropdownRef} className="relative">
			<div onClick={toggleDropdown} className="cursor-pointer">
				{trigger}
			</div>

			{isOpen && (
				<div
					className={`absolute mt-2 z-50 min-w-50 rounded-lg border border-border bg-background shadow-lg transition-all duration-200 ${
						align === "right" ? "right-0" : "left-0"
					} ${className}`}
				>
					{children}
				</div>
			)}
		</div>
	);
};

export default Dropdown;
