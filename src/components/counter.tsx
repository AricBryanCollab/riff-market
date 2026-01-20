import { type LucideIcon, Minus, Plus } from "lucide-react";

interface CounterProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	icon?: LucideIcon;
	showInput?: boolean;
	showLimit?: boolean;
}

const Counter = ({
	inputId,
	label,
	disabled,
	value,
	onChange,
	min = 0,
	max = 999,
	icon: Icon,
	showInput = true,
	showLimit = true,
}: CounterProps) => {
	const handleIncrement = () => {
		if (value < max) onChange(value + 1);
	};

	const handleDecrement = () => {
		if (value > min) onChange(value - 1);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = Number(e.target.value);
		if (!Number.isNaN(newValue) && newValue >= min && newValue <= max) {
			onChange(newValue);
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
						<Minus size={18} />
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
						<Plus size={18} />
					</button>
				</div>
				{showLimit && (min !== undefined || max !== undefined) && (
					<div className="flex flex-col text-xs text-foreground/60">
						({min} - {max})
					</div>
				)}
			</div>
		</div>
	);
};

export default Counter;
