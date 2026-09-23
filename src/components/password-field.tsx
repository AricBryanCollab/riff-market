import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
	id: string;
	label: string;
	disabled?: boolean;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	icon?: LucideIcon;
	className?: string;
	autoComplete?: "current-password" | "new-password";
}

export function PasswordField({
	id,
	label,
	disabled,
	value,
	onChange,
	placeholder,
	icon: Icon,
	className,
	autoComplete = "current-password",
}: PasswordFieldProps) {
	const [isVisible, setIsVisible] = useState(false);

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
					type={isVisible ? "text" : "password"}
					autoComplete={autoComplete}
					value={value}
					onChange={onChange}
					disabled={disabled}
					className={cn(Icon && "pl-10", "pr-10")}
					placeholder={placeholder || label.toLowerCase()}
				/>
				<button
					type="button"
					onClick={() => setIsVisible(!isVisible)}
					aria-label={isVisible ? "Hide password" : "Show password"}
					className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer text-foreground hover:text-primary focus-visible:text-primary focus-visible:outline-none transition-colors"
				>
					<EyeOff
						size={20}
						className={cn(
							"absolute inset-0 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isVisible
								? "scale-100 opacity-100 blur-[0px]"
								: "scale-[0.25] opacity-0 blur-[4px]",
						)}
					/>
					<Eye
						size={20}
						className={cn(
							"transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
							isVisible
								? "scale-[0.25] opacity-0 blur-[4px]"
								: "scale-100 opacity-100 blur-[0px]",
						)}
					/>
				</button>
			</div>
		</Field>
	);
}
