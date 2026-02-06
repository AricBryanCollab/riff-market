import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { updateUserProfile } from "@/lib/tanstack-query/user.queries";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";
import type { UpdateUserRequest } from "@/types/user";
import { validatePhoneNumber } from "@/utils/validatePhoneNumber";

const useUpdateUser = () => {
	const queryClient = useQueryClient();
	const { user, setUser } = useUserStore();
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
		mutationFn: updateUserProfile,
		onSuccess: async (response) => {
			const updatedUser =
				response || (user && userData ? { ...user, ...userData } : null);

			if (updatedUser) {
				queryClient.setQueryData(["auth", "user"], updatedUser);

				setUser(updatedUser);
			}

			showToast("Your profile has been successfully updated", "success");
			setCloseDialog();
		},
		onError: (error) => {
			console.error(error);
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
