import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/tanstack-query/auth-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { useToastStore } from "@/store/toast";

export const useSignOut = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			queryClient.setQueryData(queryKeys.auth.user, null);
			queryClient.removeQueries({ queryKey: queryKeys.notifications.root });
			queryClient.removeQueries({ queryKey: queryKeys.orders.root });

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
