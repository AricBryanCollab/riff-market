import { ChevronDown, type LucideIcon, Search } from "lucide-react";
import { useState } from "react";

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

	const openSelections = () => setIsSelectOpened(!isSelectOpened);

	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption?.label ?? label;
	const displayIcon = selectedOption?.icon;

	const renderIcon = (icon: string | LucideIcon | undefined) => {
		if (!icon) return null;

		if (typeof icon === "string") {
			return <span>{icon}</span>;
		}

		const IconComponent = icon as LucideIcon;
		return <IconComponent size={18} />;
	};

	return (
		<div className="flex flex-col relative">
			<div
				onClick={openSelections}
				className={`${width} px-2 py-1 flex flex-col justify-between items-center border rounded-md
                      ${isSelectOpened ? "border-primary" : "border-dark/20"}
                      text-foreground cursor-pointer
                      `}
			>
				<div className="flex justify-between items-center w-full px-2 gap-2 text-sm border-transparent focus:border-primary">
					<p className="flex items-center gap-x-1">
						{Icon && <Icon size={18} />}
						{renderIcon(displayIcon)}
						<span>{displayText}</span>
					</p>
					<ChevronDown
						size={20}
						className={`transform transition-transform ${isSelectOpened ? "rotate-180" : "rotate-0"}`}
					/>
				</div>
			</div>
			<ul
				className={`absolute top-full mt-1 ${width} bg-muted overflow-y-auto z-50 border border-dark/20 rounded-md
            ${isSelectOpened ? "max-h-60" : "max-h-0 hidden"}`}
				onClick={(e) => e.stopPropagation()}
			>
				{withSearchBar && (
					<div className="flex items-center gap-2 px-2 sticky top-0 bg-muted">
						<Search size={18} />
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value.toLowerCase())}
							placeholder={placeholder}
							className={`placeholder:text-muted-foreground text-sm w-full my-2 indent-2 py-1 px-2 outline-none border border-border focus:border-primary rounded-lg
                  bg-background text-foreground
              `}
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
	);
};

export default Select;
