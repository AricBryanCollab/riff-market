import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

interface FormInputProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	isPassword?: boolean;
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	icon?: LucideIcon;
}

const Input = ({
	inputId,
	label,
	disabled,
	isPassword = false,
	value,
	onChange,
	icon: Icon,
}: FormInputProps) => {
	const [isVisible, setIsVisible] = useState<boolean>(false);

	const toggleVisible = () => {
		setIsVisible(!isVisible);
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
				<input
					id={inputId}
					type={
						inputId.includes("password")
							? "password"
							: inputId === "email"
								? "email"
								: "text"
					}
					value={value}
					onChange={onChange}
					disabled={disabled}
					className={`w-full rounded-lg border border-primary bg-muted px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent ${Icon ? "pl-10" : ""}`}
					placeholder={label.toLowerCase()}
				/>

				{isPassword && (
					<button
						type="button"
						onClick={toggleVisible}
						className="absolute z-10 top-3 right-4 cursor-pointer"
					>
						{isVisible ? <EyeOff size="20" /> : <Eye size="20" />}
					</button>
				)}
			</div>
		</div>
	);
};

export default Input;
