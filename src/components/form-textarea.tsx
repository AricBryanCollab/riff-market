import type { LucideIcon } from "lucide-react";
import type { ChangeEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormTextAreaProps {
	id: string;
	label: string;
	disabled?: boolean;
	value: string;
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	icon?: LucideIcon;
	rows?: number;
	maxLength?: number;
	showCounter?: boolean;
	className?: string;
}

export function FormTextArea({
	id,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	icon: Icon,
	rows = 4,
	maxLength,
	showCounter = false,
	className,
}: FormTextAreaProps) {
	return (
		<Field className={cn("my-2", className)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				{Icon && (
					<div className="absolute left-3 top-3 text-foreground">
						<Icon size={18} />
					</div>
				)}
				<Textarea
					id={id}
					name={id}
					value={value}
					onChange={onChange}
					disabled={disabled}
					rows={rows}
					maxLength={maxLength}
					className={cn(Icon && "pl-10", "resize-none")}
					placeholder={placeholder || label.toLowerCase()}
				/>
				{showCounter && maxLength && (
					<div className="absolute bottom-2 right-3 text-xs text-foreground/60">
						{value.length}/{maxLength}
					</div>
				)}
			</div>
		</Field>
	);
}
