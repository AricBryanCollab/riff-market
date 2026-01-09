import type { LucideIcon } from "lucide-react";

interface CounterProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	value: number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	min?: number;
	max?: number;
	icon?: LucideIcon;
	showInput?: boolean;
}

export const Counter = ({
	inputId,
	label,
	disabled,
	value,
	onChange,
	min = 0,
	max = 999,
	icon: Icon,
	showInput = true,
}: CounterProps) => {
	const createSyntheticEvent = (
		newValue: number,
	): React.ChangeEvent<HTMLInputElement> => {
		return {
			target: {
				id: inputId,
				value: String(newValue),
				type: "number",
			},
		} as React.ChangeEvent<HTMLInputElement>;
	};

	const handleIncrement = () => {
		if (value < max) {
			onChange(createSyntheticEvent(value + 1));
		}
	};

	const handleDecrement = () => {
		if (value > min) {
			onChange(createSyntheticEvent(value - 1));
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = Number(e.target.value);
		if (!Number.isNaN(newValue) && newValue >= min && newValue <= max) {
			onChange(e);
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
			<div className="relative flex flex-col w-fit gap-2">
				{Icon && (
					<div className="text-foreground">
						<Icon size={18} />
					</div>
				)}
				<div className="flex items-center border border-primary rounded-lg overflow-hidden bg-muted">
					<button
						type="button"
						onClick={handleDecrement}
						disabled={disabled || value <= min}
						className="px-4 py-2.5 text-white bg-primary hover:bg-accent cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
					>
						−
					</button>
					{showInput ? (
						<input
							id={inputId}
							type="number"
							value={value}
							onChange={handleInputChange}
							disabled={disabled}
							min={min}
							max={max}
							step={1}
							className="w-20 text-center bg-muted text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						/>
					) : (
						<div className="w-20 text-center text-sm font-medium py-2.5">
							{value}
						</div>
					)}
					<button
						type="button"
						onClick={handleIncrement}
						disabled={disabled || value >= max}
						className="px-4 py-2.5 text-white bg-primary hover:bg-accent cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
					>
						+
					</button>
				</div>
				{(min !== undefined || max !== undefined) && (
					<div className="flex flex-col text-xs text-foreground/60">
						({min} - {max})
					</div>
				)}
			</div>
		</div>
	);
};
