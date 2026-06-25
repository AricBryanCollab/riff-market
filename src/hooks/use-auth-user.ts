import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { getCurrentUserFn } from "@/server/user.functions";
import type { UserProfile } from "@/types/user";

export const useAuthUser = () => {
	const userQuery = useQuery<UserProfile>({
		queryKey: queryKeys.auth.user,
		queryFn: () => getCurrentUserFn(),
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
