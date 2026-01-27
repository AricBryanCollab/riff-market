import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
	label: string;
	value: string;
}

interface SearchableSelectProps {
	options: SelectOption[];
	onValueChange: (value: string) => void;
	value: string;
	label?: string;
	placeholder?: string;
	className?: string;
}

export function SearchableSelect({
	options,
	onValueChange,
	value,
	label,
	placeholder = "Search for options",
	className,
}: SearchableSelectProps) {
	const [searchValue, setSearchValue] = useState("");

	const filteredOptions = useMemo(
		() =>
			options.filter((opt) =>
				opt.label.toLowerCase().includes(searchValue.toLowerCase()),
			),
		[options, searchValue],
	);

	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<Field className={cn("my-2", className)}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Select
				value={value}
				onValueChange={(val) => {
					setSearchValue("");
					if (val) onValueChange(val);
				}}
				onOpenChange={(open) => {
					if (!open) setSearchValue("");
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select an option">
						{selectedOption?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<div className="flex items-center gap-2 px-2 sticky top-0 bg-popover border-b border-border">
						<Search size={18} className="text-muted-foreground" />
						<input
							type="text"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							placeholder={placeholder}
							aria-label="Search options"
							className="text-sm w-full my-2 py-1 px-2 border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						/>
					</div>
					{filteredOptions.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}
