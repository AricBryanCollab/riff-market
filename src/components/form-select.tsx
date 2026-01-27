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

interface FormSelectProps {
	options: SelectOption[];
	onValueChange: (value: string) => void;
	value: string;
	label?: string;
	placeholder?: string;
	className?: string;
}

export function FormSelect({
	options,
	onValueChange,
	value,
	label,
	placeholder = "Select an option",
	className,
}: FormSelectProps) {
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<Field className={cn("my-2", className)}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Select value={value} onValueChange={(val) => val && onValueChange(val)}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder={placeholder}>
						{selectedOption?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}
