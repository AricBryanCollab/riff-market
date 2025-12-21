import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/tanstack-query/auth.queries";
import { useUserStore } from "@/store/user";

export const useSignOut = () => {
	const { clearUser } = useUserStore();
	const queryClient = useQueryClient();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			clearUser();

			queryClient.removeQueries({ queryKey: ["auth", "user"] });
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
