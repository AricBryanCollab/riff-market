import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientLogger } from "@/lib/client-logger";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { updateCurrentUserProfilePictureFn } from "@/server/user.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import type { UserProfile } from "@/types/user";

const useUpdateProfilePicture = () => {
	const queryClient = useQueryClient();
	const { setCloseDialog } = useDialogStore();
	const { showToast } = useToastStore();

	const {
		mutate,
		isPending: loadingUpdateProfilePicture,
		isError: errorUpdateProfilePicture,
	} = useMutation({
		mutationFn: (profilePic: File) => {
			const formData = new FormData();
			formData.append("profilePic", profilePic);

			return updateCurrentUserProfilePictureFn({
				data: formData,
			});
		},
		onSuccess: ({ profilePic }) => {
			queryClient.setQueryData<UserProfile | null>(
				queryKeys.auth.user,
				(currentUser) =>
					currentUser ? { ...currentUser, profilePic } : currentUser,
			);

			setCloseDialog();
			showToast("Your profile picture has been updated", "success");
		},
		onError: (error) => {
			clientLogger.error("Failed to update profile picture", error);
			const message =
				error instanceof Error
					? error.message
					: "Failed to update your profile picture";
			showToast(message, "error");
		},
	});

	const handleUpdateProfilePicture = (profilePic: File) => {
		mutate(profilePic);
	};

	return {
		handleUpdateProfilePicture,
		loadingUpdateProfilePicture,
		errorUpdateProfilePicture,
	};
};

export default useUpdateProfilePicture;
