import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { clearAuthenticatedClientState } from "@/lib/client-account-state";
import { clientLogger } from "@/lib/client-logger";
import { deleteCurrentUserFn } from "@/server/user.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";

const useDeleteUser = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { setCloseDialog } = useDialogStore();
	const { showToast } = useToastStore();

	const {
		mutate,
		isPending: loadingDeleteUser,
		isError: errorDeleteUser,
	} = useMutation({
		mutationFn: (email: string) => deleteCurrentUserFn({ data: { email } }),
		onSuccess: () => {
			clearAuthenticatedClientState(queryClient);
			setCloseDialog();
			showToast("Your account has been deleted", "success");
			navigate({ to: "/" });
		},
		onError: (error) => {
			clientLogger.error("Failed to delete user account", error);
			const message =
				error instanceof Error
					? error.message
					: "Failed to delete your account";
			showToast(message, "error");
		},
	});

	const handleDeleteUser = (email: string) => {
		mutate(email);
	};

	return {
		handleDeleteUser,
		loadingDeleteUser,
		errorDeleteUser,
	};
};

export default useDeleteUser;
