import type { QueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import { clearAccountCache } from "./tanstack-query/cache-policy";

export function clearAuthenticatedClientState(queryClient: QueryClient) {
	clearAccountCache(queryClient);
	useCartStore.getState().clearCart();
	useUserStore.getState().clearUser();
	useThemeStore.getState().cancelPreview();
}
