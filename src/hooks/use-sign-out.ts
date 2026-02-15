import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/tanstack-query/auth.queries";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";

export const useSignOut = () => {
	const { clearUser } = useUserStore();
	const { showToast } = useToastStore();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			clearUser();

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
