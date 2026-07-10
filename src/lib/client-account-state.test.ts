import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/store/cart";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import type { UserProfile } from "@/types/user";
import { clearAuthenticatedClientState } from "./client-account-state";
import { queryKeys } from "./tanstack-query/query-keys";

function makeUser(): UserProfile {
	return {
		id: "user-1",
		firstName: "Angus",
		lastName: "Young",
		email: "angus@example.com",
		role: "CUSTOMER",
		theme: "dark",
		phone: null,
		profilePic: null,
		address: null,
	};
}

describe("clearAuthenticatedClientState", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient();
		useCartStore.getState().clearCart();
		useUserStore.getState().clearUser();
		useThemeStore.getState().setTheme("light");
	});

	it("clears account-owned client state and session listing queries", async () => {
		const user = makeUser();

		queryClient.setQueryData(queryKeys.auth.user, user);
		queryClient.setQueryData(queryKeys.notifications.count, { count: 3 });
		queryClient.setQueryData(queryKeys.orders.byRole("CUSTOMER"), [
			{ id: "order-1" },
		]);
		queryClient.setQueryData(queryKeys.listings.featured, [
			{ id: "listing-1" },
		]);
		queryClient.setQueryData(queryKeys.listings.pending, [{ id: "listing-2" }]);
		queryClient.setQueryData(queryKeys.listings.detail("listing-1", "public"), {
			id: "listing-1",
		});
		queryClient.setQueryData(queryKeys.listings.cartDetails(["listing-1"]), [
			{ id: "listing-1" },
		]);

		useCartStore.getState().addItem("listing-1", user.id, user.role);
		useUserStore.getState().setUser(user);
		useThemeStore.getState().setTheme("dark");
		useThemeStore.getState().setPreviewTheme("light");

		await clearAuthenticatedClientState(queryClient);

		expect(queryClient.getQueryData(queryKeys.auth.user)).toBeNull();
		expect(
			queryClient.getQueryData(queryKeys.notifications.count),
		).toBeUndefined();
		expect(
			queryClient.getQueryData(queryKeys.orders.byRole("CUSTOMER")),
		).toBeUndefined();
		expect(queryClient.getQueryData(queryKeys.listings.featured)).toEqual([
			{ id: "listing-1" },
		]);
		expect(
			queryClient.getQueryData(queryKeys.listings.pending),
		).toBeUndefined();
		expect(
			queryClient.getQueryData(queryKeys.listings.detail("listing-1", "public")),
		).toBeUndefined();
		expect(
			queryClient.getQueryData(queryKeys.listings.cartDetails(["listing-1"])),
		).toBeUndefined();
		expect(useCartStore.getState()).toMatchObject({
			items: [],
			userId: null,
			userRole: null,
		});
		expect(useUserStore.getState().user).toBeNull();
		expect(useThemeStore.getState().theme).toBe("dark");
		expect(useThemeStore.getState().previewTheme).toBeNull();
	});
});
