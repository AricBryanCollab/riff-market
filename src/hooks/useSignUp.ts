import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { signUp } from "@/lib/tanstack-query/auth.queries";
import { useDialogStore } from "@/store/dialog";
import type { SignUpRequest } from "@/types/auth";
import type { UserRole } from "@/types/enum";

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
	const { setCloseDialog } = useDialogStore();
	const { mutate, isPending, isError } = useMutation({
		mutationFn: signUp,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
		},
	});

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSignUpData({ ...signUpData, [e.target.id]: e.target.value });
	};

	const onChangeRole = (role: UserRole) => {
		setSignUpData({ ...signUpData, role: role });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		mutate({ ...signUpData, role: signUpData.role ?? "CUSTOMER" });

		setCloseDialog();
		// TODO: toast
	};

	return {
		signUpData,
		loading: isPending,
		isError,
		onChange,
		onChangeRole,
		handleSubmit,
	};
};

export default useSignUp;
