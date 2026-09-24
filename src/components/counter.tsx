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
				<div className="flex h-12 items-center rounded-lg bg-background p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_-1px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.13)]">
					<button
						type="button"
						aria-label="Decrease quantity"
						onClick={handleDecrement}
						disabled={disabled || value <= min}
						className="flex size-10 items-center justify-center rounded-sm text-foreground cursor-pointer transition-[background-color,scale] hover:bg-muted active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
							className="h-10 w-14 rounded-sm bg-transparent text-center text-sm font-semibold text-foreground tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						/>
					) : (
						<div className="w-14 text-center text-sm font-semibold text-foreground tabular-nums">
							{value}
						</div>
					)}
					<button
						type="button"
						aria-label="Increase quantity"
						onClick={handleIncrement}
						disabled={disabled || value >= max}
						className="flex size-10 items-center justify-center rounded-sm text-foreground cursor-pointer transition-[background-color,scale] hover:bg-muted active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
