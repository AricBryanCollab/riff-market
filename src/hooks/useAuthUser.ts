import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "@/lib/tanstack-query/user.queries";
import { useUserStore } from "@/store/user";

export const useAuthUser = () => {
	const { setUser, clearUser } = useUserStore();

	const userQuery = useQuery({
		queryKey: ["auth", "user"],
		queryFn: getCurrentUser,
		enabled: false,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
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
