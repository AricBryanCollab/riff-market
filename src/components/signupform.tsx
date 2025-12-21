import { KeyRound, Lock, Mail, User } from "lucide-react";
import Button from "@/components/button";
import Input from "@/components/input";

const SignUpForm = () => {
	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<div className="grid grid-cols-2 gap-2 my-2">
				<Input
					inputId="firstName"
					label="First Name"
					value=""
					onChange={() => {}}
					icon={User}
				/>

				<Input
					inputId="lastName"
					label="Last Name"
					value=""
					onChange={() => {}}
					icon={User}
				/>
			</div>

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

			<Input
				inputId="confirmPassword"
				label="Confirm Password"
				value=""
				onChange={() => {}}
				icon={KeyRound}
				isPassword
			/>

			<div className="mt-8 mb-4 flex justify-between items-center gap-2 ">
				<div className="">
					Already have an account?{" "}
					<button
						type="button"
						className="font-semibold text-primary hover:text-shadow-foreground hover:underline transition-colors"
						onClick={() => {}}
					>
						Sign In
					</button>
				</div>
				<Button variant="primary" action={() => {}}>
					Sign Up
				</Button>
			</div>
		</form>
	);
};

export default SignUpForm;
