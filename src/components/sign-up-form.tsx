import { KeyRound, Lock, Mail, User } from "lucide-react";
import { FormField } from "@/components/form-field";
import { FormSelect } from "@/components/form-select";
import { PasswordField } from "@/components/password-field";
import { LoadingButton } from "@/components/ui/loading-button";
import { roleOptions } from "@/constants/select-options";
import useAuthDialog from "@/hooks/use-auth-dialog";
import useSignUp from "@/hooks/use-sign-up";
import type { UserRole } from "@/types/enum";

const SignUpForm = () => {
	const { signUpData, loading, isError, onChange, onChangeRole, handleSubmit } =
		useSignUp();

	const { handleSwitchAuth } = useAuthDialog();

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid grid-cols-2 gap-2 my-2">
				<FormField
					id="firstName"
					label="First Name"
					value={signUpData.firstName}
					onChange={onChange}
					icon={User}
				/>

				<FormField
					id="lastName"
					label="Last Name"
					value={signUpData.lastName}
					onChange={onChange}
					icon={User}
				/>
			</div>

			<FormField
				id="email"
				label="Email"
				type="email"
				value={signUpData.email}
				onChange={onChange}
				icon={Mail}
			/>

			<PasswordField
				id="password"
				label="Password"
				value={signUpData.password}
				onChange={onChange}
				icon={Lock}
				autoComplete="new-password"
			/>

			<PasswordField
				id="confirmPassword"
				label="Confirm Password"
				value={signUpData.confirmPassword}
				onChange={onChange}
				icon={KeyRound}
				autoComplete="new-password"
			/>

			<div className="mt-8 my-4">
				<FormSelect
					options={roleOptions.map((r) => ({
						label: r.label,
						value: r.value,
					}))}
					value={signUpData.role as string}
					onValueChange={(value: string) => onChangeRole(value as UserRole)}
					label="I want to..."
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
				<LoadingButton loading={loading} type="submit">
					Sign Up
				</LoadingButton>
			</div>
		</form>
	);
};

export default SignUpForm;
