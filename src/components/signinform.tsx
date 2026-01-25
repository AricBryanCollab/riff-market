import { Lock, Mail } from "lucide-react";
import Input from "@/components/input";
import { LoadingButton } from "@/components/ui/loading-button";
import useAuthDialog from "@/hooks/useAuthDialog";
import useSignIn from "@/hooks/useSignIn";

const SignInForm = () => {
	const { signInData, loading, isError, onChange, handleSubmit } = useSignIn();

	const { handleSwitchAuth } = useAuthDialog();

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex flex-col w-full gap-4">
				<Input
					inputId="email"
					label="Email"
					value={signInData.email}
					onChange={onChange}
					icon={Mail}
				/>

				<Input
					inputId="password"
					label="Password"
					value={signInData.password}
					onChange={onChange}
					icon={Lock}
					isPassword
				/>
			</div>
			<div className="h-5 my-2">
				{isError && (
					<p className="text-center text-sm text-destructive">
						*Failed to sign in
					</p>
				)}
			</div>

			<div className="mb-6 flex justify-between items-center gap-2 ">
				<div className="">
					Don&apos;t have an account?{" "}
					<button
						type="button"
						className="font-semibold cursor-pointer text-primary hover:text-shadow-foreground hover:underline transition-colors"
						onClick={() => handleSwitchAuth("signup")}
					>
						Sign Up
					</button>
				</div>
				<LoadingButton loading={loading} type="submit">
					Sign In
				</LoadingButton>
			</div>
		</form>
	);
};

export default SignInForm;
