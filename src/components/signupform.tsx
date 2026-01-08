import { KeyRound, Lock, Mail, User, UserRoundPlus } from "lucide-react";
import Button from "@/components/button";
import Input from "@/components/input";
import Select from "@/components/select";
import { roleOptions } from "@/constants/selectOptions";
import useAuthDialog from "@/hooks/useAuthDialog";
import useSignUp from "@/hooks/useSignUp";
import type { UserRole } from "@/types/enum";

const SignUpForm = () => {
	const { signUpData, loading, isError, onChange, onChangeRole, handleSubmit } =
		useSignUp();

	const { handleSwitchAuth } = useAuthDialog();

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid grid-cols-2 gap-2 my-2">
				<Input
					inputId="firstName"
					label="First Name"
					value={signUpData.firstName}
					onChange={onChange}
					icon={User}
				/>

				<Input
					inputId="lastName"
					label="Last Name"
					value={signUpData.lastName}
					onChange={onChange}
					icon={User}
				/>
			</div>

			<Input
				inputId="email"
				label="Email"
				value={signUpData.email}
				onChange={onChange}
				icon={Mail}
			/>

			<Input
				inputId="password"
				label="Password"
				value={signUpData.password}
				onChange={onChange}
				icon={Lock}
				isPassword
			/>

			<Input
				inputId="confirmPassword"
				label="Confirm Password"
				value={signUpData.confirmPassword}
				onChange={onChange}
				icon={KeyRound}
				isPassword
			/>

			<div className="mt-8 my-4">
				<Select
					options={roleOptions.map((r) => ({
						label: r.label,
						value: r.value,
						icon: r.icon,
					}))}
					value={signUpData.role as string}
					icon={UserRoundPlus}
					onChangeValue={(value: string) => onChangeRole(value as UserRole)}
					label="I want to..."
					withSearchBar={false}
				/>
			</div>
			<div className="h-5 my-2">
				{isError && (
					<p className="text-center text-sm text-destructive">
						*Failed to sign up
					</p>
				)}
			</div>
			<div className="mb-6 flex justify-between items-center gap-2 ">
				<div className="">
					Already have an account?{" "}
					<button
						type="button"
						className="font-semibold cursor-pointer text-primary hover:text-shadow-foreground hover:underline transition-colors"
						onClick={() => handleSwitchAuth("signin")}
					>
						Sign In
					</button>
				</div>
				<Button loading={loading} variant="primary" type="submit">
					Sign Up
				</Button>
			</div>
		</form>
	);
};

export default SignUpForm;
