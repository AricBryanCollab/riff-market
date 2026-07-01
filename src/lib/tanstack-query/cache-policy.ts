import type { QueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/types/user";
import { queryKeys } from "./query-keys";

export function setCurrentUserCache(
	queryClient: QueryClient,
	user: UserProfile | null,
) {
	queryClient.setQueryData<UserProfile | null>(queryKeys.auth.user, user);
}

export function updateCurrentUserCache(
	queryClient: QueryClient,
	updateUser: (currentUser: UserProfile | null) => UserProfile | null,
) {
	queryClient.setQueryData<UserProfile | null>(
		queryKeys.auth.user,
		(currentUser) => updateUser(currentUser ?? null),
	);
}

export function clearAccountCache(queryClient: QueryClient) {
	setCurrentUserCache(queryClient, null);
	queryClient.removeQueries({ queryKey: queryKeys.notifications.root });
	queryClient.removeQueries({ queryKey: queryKeys.orders.root });
}

export function invalidateOrdersCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.orders.root });
}

export function invalidateListingCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.listings.root });
}
