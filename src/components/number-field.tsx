import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
	id: string;
	label: string;
	disabled?: boolean;
	value: number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	className?: string;
	min?: number;
	step?: number;
}

export function NumberField({
	id,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	className,
	min,
	step,
}: NumberFieldProps) {
	return (
		<Field className={cn("my-2", className)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input
				id={id}
				name={id}
				type="number"
				value={value}
				onChange={onChange}
				min={min}
				step={step}
				disabled={disabled}
				className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				placeholder={placeholder || label.toLowerCase()}
			/>
		</Field>
	);
}
