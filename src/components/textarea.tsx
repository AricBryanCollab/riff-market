import type { LucideIcon } from "lucide-react";

interface TextAreaProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	icon?: LucideIcon;
	rows?: number;
	maxLength?: number;
	showCounter?: boolean;
	resize?: "none" | "vertical" | "horizontal" | "both";
}

const TextArea = ({
	inputId,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	icon: Icon,
	rows = 4,
	maxLength,
	showCounter = false,
	resize = "vertical",
}: TextAreaProps) => {
	const currentLength = value.length;
	const resizeClass = {
		none: "resize-none",
		vertical: "resize-y",
		horizontal: "resize-x",
		both: "resize",
	}[resize];

	return (
		<div className="flex flex-col gap-1 my-2">
			<label
				htmlFor={inputId}
				className="block text-sm font-semibold tracking-wide text-foreground"
			>
				{label}
			</label>
			<div className="relative">
				{Icon && (
					<div className="absolute left-3 top-3 text-foreground">
						<Icon size={18} />
					</div>
				)}
				<textarea
					id={inputId}
					value={value}
					onChange={onChange}
					disabled={disabled}
					rows={rows}
					maxLength={maxLength}
					className={`w-full rounded-lg border border-primary bg-muted px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent ${Icon ? "pl-10" : ""} ${resizeClass}`}
					placeholder={placeholder || label.toLowerCase()}
				/>
				{showCounter && maxLength && (
					<div className="absolute bottom-2 right-3 text-xs text-foreground/60">
						{currentLength}/{maxLength}
					</div>
				)}
			</div>
			{showCounter && maxLength && (
				<div className="text-xs text-foreground/60 text-right">
					{currentLength}/{maxLength} characters
				</div>
			)}
		</div>
	);
};

export default TextArea;
