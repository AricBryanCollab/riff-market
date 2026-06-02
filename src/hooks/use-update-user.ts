import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { clientLogger } from "@/lib/client-logger";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { updateCurrentUserFn } from "@/server/user.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import type { UpdateUserRequest } from "@/types/user";
import { validatePhoneNumber } from "@/utils/validate-phone-number";

const useUpdateUser = () => {
	const queryClient = useQueryClient();
	const { data: user } = useAuthUser();
	const { setCloseDialog } = useDialogStore();
	const { showToast } = useToastStore();

	const [userData, setUserData] = useState<UpdateUserRequest | null>(null);

	useEffect(() => {
		if (!user) return;

		setUserData({
			firstName: user.firstName,
			lastName: user.lastName,
			address: user.address,
			phone: user.phone,
		});
	}, [user]);

	const onChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value } = e.target;

		setUserData((prev) =>
			prev
				? {
						...prev,
						[id]: value,
					}
				: prev,
		);
	};

	const handleCloseDialog = () => {
		if (user) {
			setUserData({
				firstName: user.firstName,
				lastName: user.lastName,
				address: user.address,
				phone: user.phone,
			});
		}

		setCloseDialog();
	};

	const {
		mutate,
		isPending: loadingUpdateUser,
		isError: errorUpdateUser,
	} = useMutation({
		mutationFn: (nextUserData: UpdateUserRequest) =>
			updateCurrentUserFn({ data: nextUserData }),
		onSuccess: async (response) => {
			const updatedUser =
				response || (user && userData ? { ...user, ...userData } : null);

			if (updatedUser) {
				queryClient.setQueryData(queryKeys.auth.user, updatedUser);
			}

			showToast("Your profile has been successfully updated", "success");
			setCloseDialog();
		},
		onError: (error) => {
			clientLogger.error("Failed to update user profile", error);
			const message =
				error instanceof Error
					? error.message
					: "Failed to update your profile";
			showToast(message, "error");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validatePhoneNumber(userData?.phone || "")) {
			showToast("Invalid phone number format", "default");
			return;
		}

		if (!userData) {
			showToast("User profile information was not read", "default");
			return;
		}

		mutate(userData);
	};

	return {
		userData,
		loadingUpdateUser,
		errorUpdateUser,
		onChange,
		handleCloseDialog,
		handleSubmit,
	};
};

export default useUpdateUser;
