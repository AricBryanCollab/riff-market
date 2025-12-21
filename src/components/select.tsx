import { ChevronDown, type LucideIcon, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
	label: string;
	value: string;
	icon?: string | LucideIcon;
}

interface SelectProps {
	options: SelectOption[];
	onChangeValue: (value: string) => void;
	value: string;
	width?: string;
	withSearchBar?: boolean;
	placeholder?: string;
	label?: string;
	icon?: LucideIcon;
}

const Select = ({
	options,
	onChangeValue,
	width = "w-full",
	label = "Select Options",
	value,
	icon: Icon,
	placeholder = "Search for Options",
	withSearchBar = true,
}: SelectProps) => {
	const [isSelectOpened, setIsSelectOpened] = useState<boolean>(false);
	const [inputValue, setInputValue] = useState<string>("");
	const selectRef = useRef<HTMLDivElement>(null);

	const openSelections = () => setIsSelectOpened(!isSelectOpened);

	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption?.label ?? "Select an option";
	const displayIcon = selectedOption?.icon;

	const renderIcon = (icon: string | LucideIcon | undefined) => {
		if (!icon) return null;

		if (typeof icon === "string") {
			return <span>{icon}</span>;
		}

		const IconComponent = icon as LucideIcon;
		return <IconComponent size={18} />;
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsSelectOpened(false);
			}
		};

		if (isSelectOpened) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isSelectOpened]);

	return (
		<div className="flex flex-col gap-1 my-2" ref={selectRef}>
			<p className="block text-sm font-semibold tracking-wide text-foreground">
				{label}
			</p>
			<div className="relative">
				<div
					onClick={openSelections}
					className={`${width} px-4 py-2.5 flex justify-between items-center border bg-muted rounded-lg cursor-pointer transition-colors
                      ${isSelectOpened ? "border-primary ring-2 ring-accent" : "border-primary"}
                      text-foreground
                      `}
				>
					<p className="flex items-center gap-2 text-sm">
						{Icon && <Icon size={18} />}
						{renderIcon(displayIcon)}
						<span>{displayText}</span>
					</p>
					<ChevronDown
						size={20}
						className={`transform transition-transform ${isSelectOpened ? "rotate-180" : "rotate-0"}`}
					/>
				</div>
				<ul
					className={`absolute top-full mt-1 ${width} bg-muted overflow-y-auto z-50 border border-primary rounded-lg shadow-lg
            ${isSelectOpened ? "max-h-60" : "max-h-0 border-0"} transition-all`}
					onClick={(e) => e.stopPropagation()}
				>
					{withSearchBar && (
						<div className="flex items-center gap-2 px-2 sticky top-0 bg-muted border-b border-border">
							<Search size={18} className="text-muted-foreground" />
							<input
								type="text"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value.toLowerCase())}
								placeholder={placeholder}
								className={`placeholder:text-muted-foreground text-sm w-full my-2 py-1 px-2 outline-none border-none bg-transparent text-foreground`}
							/>
						</div>
					)}
					{options
						.filter((opt) => opt.label.toLowerCase().includes(inputValue))
						.map((opt) => (
							<li
								key={opt.value}
								className={`text-sm p-2 hover:bg-primary hover:text-white cursor-pointer transition-colors
                ${opt.value === value ? "bg-primary text-white" : "text-foreground"}
              `}
								onClick={() => {
									setInputValue("");
									setIsSelectOpened(false);
									onChangeValue(opt.value);
								}}
							>
								<span className="flex items-center gap-2">
									{renderIcon(opt.icon)}
									{opt.label}
								</span>
							</li>
						))}
				</ul>
			</div>
		</div>
	);
};

export default Select;
