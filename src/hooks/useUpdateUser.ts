import { useEffect, useState } from "react";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";
import type { UpdateUserRequest } from "@/types/user";
import { validatePhoneNumber } from "@/utils/validatePhoneNumber";

const useUpdateUser = () => {
	const { user } = useUserStore();
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validatePhoneNumber(userData?.phone || "")) {
			showToast("Invalid phone number format", "default");
			return;
		}

		console.log(userData);
	};

	return {
		userData,
		onChange,
		handleCloseDialog,
		handleSubmit,
	};
};

export default useUpdateUser;
