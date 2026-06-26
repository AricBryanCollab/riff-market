import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { getOptionalCurrentUserFn } from "@/server/user.functions";
import type { UserProfile } from "@/types/user";
import { queryKeys } from "./query-keys";

export const authUserStaleTime = 1000 * 60 * 5;

export const optionalAuthUserQueryOpt = queryOptions<UserProfile | null>({
	queryKey: queryKeys.auth.user,
	queryFn: () => getOptionalCurrentUserFn(),
	retry: false,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	staleTime: authUserStaleTime,
});

export async function refreshAuthUser(queryClient: QueryClient) {
	await queryClient.invalidateQueries({
		queryKey: queryKeys.auth.user,
		refetchType: "none",
	});

	return queryClient.fetchQuery(optionalAuthUserQueryOpt);
}
