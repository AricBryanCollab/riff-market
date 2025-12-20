import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

interface FormInputProps {
	id: string;
	type?: string;
	label: string;
	disabled?: boolean;
	required?: boolean;
	isPassword?: boolean;
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	icon?: LucideIcon;
	validationMessage?: string;
}

const Input = ({
	id,
	type,
	label,
	disabled,
	required,
	isPassword = false,
	value,
	onChange,
	icon: Icon,
	validationMessage,
}: FormInputProps) => {
	const [isVisible, setIsVisible] = useState<boolean>(false);

	const toggleVisible = () => {
		setIsVisible(!isVisible);
	};

	return (
		<div className="relative flex flex-col my-3">
			<p className="my-2 flex items-center gap-2">
				{Icon && <Icon size="18" />}
				<span className="text-sm">{label}</span>
			</p>
			<input
				id={id}
				type={type === "password" ? (isVisible ? "text" : "password") : type}
				disabled={disabled}
				required={required}
				value={value}
				onChange={onChange}
				className={`rounded-xl p-2 h-8 border border-neutral focus:border-primary focus:ring-primary focus:outline-none
          
        `}
			/>
			{isPassword && (
				<button
					type="button"
					onClick={toggleVisible}
					className="absolute z-10 top-10.5 right-4 cursor-pointer"
				>
					{isVisible ? <EyeOff size="20" /> : <Eye size="20" />}
				</button>
			)}
			<div className="my-2">
				<p className="text-xs">{validationMessage}</p>
			</div>
		</div>
	);
};

export default Input;
