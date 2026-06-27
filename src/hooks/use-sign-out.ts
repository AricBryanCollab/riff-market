import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearAuthenticatedClientState } from "@/lib/client-account-state";
import { signOutFn } from "@/server/auth.functions";
import { useToastStore } from "@/store/toast";

export const useSignOut = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: () => signOutFn(),
		onSuccess: () => {
			clearAuthenticatedClientState(queryClient);
			showToast("You have logged out", "success");
		},
	});

	const handleSignOut = () => {
		mutate();
	};

	return {
		signOut: handleSignOut,
		loading: isPending,
		isError,
	};
};
