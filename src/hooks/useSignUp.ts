import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { signUp } from "@/lib/tanstack-query/auth.queries";
import type { SignUpRequest } from "@/types/auth";

const initialSignUp = {
	firstName: "",
	lastName: "",
	email: "",
	password: "",
	confirmPassword: "",
	role: null,
};

const useSignUp = () => {
	const [signUpData, setSignUpData] = useState<SignUpRequest>(initialSignUp);
	const queryClient = useQueryClient();
	const { mutate, isPending, isError } = useMutation({
		mutationFn: signUp,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
		},
	});

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSignUpData({ ...signUpData, [e.target.id]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		mutate({ ...signUpData, role: signUpData.role ?? "CUSTOMER" });
	};

	return { signUpData, loading: isPending, isError, onChange, handleSubmit };
};

export default useSignUp;
