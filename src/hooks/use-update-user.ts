import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { isValidPhoneNumber } from "@/domains/accounts/domain/phone-number";
import { useAuthUser } from "@/hooks/use-auth-user";
import { clientLogger } from "@/lib/client-logger";
import { setCurrentUserCache } from "@/lib/tanstack-query/cache-policy";
import { updateCurrentUserFn } from "@/server/user.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import type { UpdateUserRequest } from "@/types/user";

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
				setCurrentUserCache(queryClient, updatedUser);
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

		if (userData?.phone && !isValidPhoneNumber(userData.phone)) {
			showToast("Phone number must be 10-12 digits", "default");
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
