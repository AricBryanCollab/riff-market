import type { QueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/types/user";
import { queryKeys } from "./query-keys";

const accountScopedListingQueryKeys = [
	queryKeys.listings.detailRoot,
	queryKeys.listings.pending,
	queryKeys.listings.cartDetailsRoot,
] as const;

const accountScopedQueryKeys = [
	queryKeys.notifications.root,
	queryKeys.orders.root,
	...accountScopedListingQueryKeys,
] as const;

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
	await Promise.all(
		accountScopedQueryKeys.map((queryKey) =>
			queryClient.cancelQueries({ queryKey }),
		),
	);
}

export async function clearAccountCache(queryClient: QueryClient) {
	await cancelAccountScopedQueries(queryClient);
	for (const queryKey of accountScopedQueryKeys) {
		queryClient.removeQueries({ queryKey });
	}
	setCurrentUserCache(queryClient, null);
}

export function invalidateOrdersCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.orders.root });
}

export function invalidateListingCache(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: queryKeys.listings.root });
}

export function invalidateAccountScopedListingCache(queryClient: QueryClient) {
	return Promise.all(
		accountScopedListingQueryKeys.map((queryKey) =>
			queryClient.invalidateQueries({ queryKey }),
		),
	);
}
