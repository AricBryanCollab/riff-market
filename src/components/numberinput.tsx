import type { LucideIcon } from "lucide-react";

interface NumberInputProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	value: number;
	onChange: (value: number) => void;
	placeholder?: string;
	icon?: LucideIcon;
	min?: number;
	max?: number;
	step?: number;
	prefix?: string;
	suffix?: string;
	decimalPlaces?: number;
	allowNegative?: boolean;
}

const NumberInput = ({
	inputId,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	icon: Icon,
	min,
	max,
	step = 0.01,
	prefix,
	suffix,
	decimalPlaces = 2,
	allowNegative = false,
}: NumberInputProps) => {
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;

		if (inputValue === "") {
			onChange(0);
			return;
		}

		let cleanValue = inputValue;
		if (prefix) cleanValue = cleanValue.replace(prefix, "");
		if (suffix) cleanValue = cleanValue.replace(suffix, "");
		cleanValue = cleanValue.trim();

		const numValue = parseFloat(cleanValue);

		if (Number.isNaN(numValue)) return;

		if (!allowNegative && numValue < 0) return;

		if (min !== undefined && numValue < min) return;
		if (max !== undefined && numValue > max) return;

		onChange(numValue);
	};

	const handleBlur = () => {
		const formatted = Number(value.toFixed(decimalPlaces));
		if (formatted !== value) {
			onChange(formatted);
		}
	};

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
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground">
						<Icon size={18} />
					</div>
				)}
				{prefix && !Icon && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm font-medium">
						{prefix}
					</div>
				)}
				<input
					id={inputId}
					type="number"
					value={value}
					onChange={handleInputChange}
					onBlur={handleBlur}
					disabled={disabled}
					min={min}
					max={max}
					step={step}
					className={`w-full rounded-lg border border-primary bg-muted px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${Icon ? "pl-10" : prefix ? "pl-8" : ""} ${suffix ? "pr-12" : ""}`}
					placeholder={placeholder || label.toLowerCase()}
				/>
				{suffix && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm font-medium">
						{suffix}
					</div>
				)}
			</div>
			{(min !== undefined || max !== undefined) && (
				<div className="text-xs text-foreground/60">
					{min !== undefined && max !== undefined
						? `Range: ${prefix || ""}${min}${suffix || ""} - ${prefix || ""}${max}${suffix || ""}`
						: min !== undefined
							? `Minimum: ${prefix || ""}${min}${suffix || ""}`
							: `Maximum: ${prefix || ""}${max}${suffix || ""}`}
				</div>
			)}
		</div>
	);
};

export default NumberInput;
