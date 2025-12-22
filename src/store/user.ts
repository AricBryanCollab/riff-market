import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserProfile } from "@/types/user";

export interface AuthState {
	user: UserProfile | null;
	setUser: (user: UserProfile) => void;
	clearUser: () => void;
	validateAuth: () => boolean;
}

export const useUserStore = create(
	persist<AuthState>(
		(set, get) => ({
			user: null,
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),
			validateAuth: () => get().user !== null,
		}),
		{
			name: "auth",
		},
	),
);
