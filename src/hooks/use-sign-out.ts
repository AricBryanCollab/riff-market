import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/tanstack-query/auth-queries";
import { useToastStore } from "@/store/toast";

export const useSignOut = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			queryClient.setQueryData(["auth", "user"], null);
			queryClient.removeQueries({ queryKey: ["notifications"] });
			queryClient.removeQueries({ queryKey: ["orders"] });

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
