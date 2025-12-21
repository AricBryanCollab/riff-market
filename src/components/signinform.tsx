import { Lock, Mail } from "lucide-react";
import Button from "@/components/button";
import Input from "@/components/input";

const SignInForm = () => {
	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<div className="flex flex-col w-full gap-4">
				<Input
					inputId="email"
					label="Email"
					value=""
					onChange={() => {}}
					icon={Mail}
				/>

				<Input
					inputId="password"
					label="Password"
					value=""
					onChange={() => {}}
					icon={Lock}
					isPassword
				/>
			</div>

			<div className="mt-8 mb-4 flex justify-between items-center gap-2 ">
				<div className="">
					Don&apos;t have an account?{" "}
					<button
						type="button"
						className="font-semibold text-primary hover:text-shadow-foreground hover:underline transition-colors"
						onClick={() => {}}
					>
						Sign Up
					</button>
				</div>
				<Button variant="primary" action={() => {}}>
					Sign In
				</Button>
			</div>
		</form>
	);
};

export default SignInForm;
