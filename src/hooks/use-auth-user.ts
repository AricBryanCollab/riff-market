import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/tanstack-query/user.queries";
import type { UserProfile } from "@/types/user";

export const useAuthUser = () => {
	const userQuery = useQuery<UserProfile>({
		queryKey: ["auth", "user"],
		queryFn: getCurrentUser,
		retry: false,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		staleTime: 1000 * 60 * 5,
	});

	return {
		...userQuery,
		data: userQuery.data ?? null,
	};
};
