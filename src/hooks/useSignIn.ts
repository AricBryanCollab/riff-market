import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { signIn } from "@/lib/tanstack-query/auth.queries";
import { getCurrentUser } from "@/lib/tanstack-query/user.queries";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import type { SignInRequest } from "@/types/auth";

const initialSignIn = {
	email: "",
	password: "",
};

const useSignIn = () => {
	const [signInData, setSignInData] = useState<SignInRequest>(initialSignIn);
	const { showToast } = useToastStore();
	const queryClient = useQueryClient();
	const { setCloseDialog } = useDialogStore();

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSignInData({ ...signInData, [e.target.id]: e.target.value });
	};

	const { mutate, isPending, isError } = useMutation({
		mutationFn: signIn,
		onSuccess: async () => {
			await queryClient.fetchQuery({
				queryKey: ["auth", "user"],
				queryFn: getCurrentUser,
			});
			showToast("You are logged in", "success");
			setCloseDialog();
		},
		onError: (error) => {
			console.error(error);
			const message =
				error instanceof Error ? error.message : "Invalid sign in";
			showToast(message, "error");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		mutate(signInData);
	};
	return {
		signInData,
		loading: isPending,
		isError,
		onChange,
		handleSubmit,
	};
};

export default useSignIn;
