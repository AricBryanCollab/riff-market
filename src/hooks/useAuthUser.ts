import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "@/lib/tanstack-query/user.queries";
import { useUserStore } from "@/store/user";

export const useAuthUser = () => {
	const setUser = useUserStore((s) => s.setUser);
	const clearUser = useUserStore((s) => s.clearUser);

	const userQuery = useQuery({
		queryKey: ["auth", "user"],
		queryFn: getCurrentUser,
		retry: false,
	});

	useEffect(() => {
		if (userQuery.isSuccess && userQuery.data) {
			setUser(userQuery.data);
		}

		if (userQuery.isError) {
			clearUser();
		}
	}, [
		userQuery.isSuccess,
		userQuery.isError,
		userQuery.data,
		setUser,
		clearUser,
	]);

	return userQuery;
};
