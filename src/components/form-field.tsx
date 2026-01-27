import type { LucideIcon } from "lucide-react";
import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
	id: string;
	label: string;
	disabled?: boolean;
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	icon?: LucideIcon;
	type?: "text" | "email" | "number";
	className?: string;
}

export function FormField({
	id,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	icon: Icon,
	type = "text",
	className,
}: FormFieldProps) {
	return (
		<Field className={cn("my-2", className)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				{Icon && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground">
						<Icon size={18} />
					</div>
				)}
				<Input
					id={id}
					name={id}
					type={type}
					value={value}
					onChange={onChange}
					disabled={disabled}
					className={cn(Icon && "pl-10")}
					placeholder={placeholder || label.toLowerCase()}
				/>
			</div>
		</Field>
	);
}
