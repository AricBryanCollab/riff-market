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

export async function cancelAccountScopedQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.cancelQueries({ queryKey: queryKeys.notifications.root }),
		queryClient.cancelQueries({ queryKey: queryKeys.orders.root }),
		queryClient.cancelQueries({ queryKey: queryKeys.listings.root }),
	]);
}

export async function clearAccountCache(queryClient: QueryClient) {
	await cancelAccountScopedQueries(queryClient);
	queryClient.removeQueries({ queryKey: queryKeys.notifications.root });
	queryClient.removeQueries({ queryKey: queryKeys.orders.root });
	queryClient.removeQueries({ queryKey: queryKeys.listings.root });
	setCurrentUserCache(queryClient, null);
}

export function invalidateOrdersCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.orders.root });
}

export function invalidateListingCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.listings.root });
}
