import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "SELLER" | "CUSTOMER";
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
}

export const useUserStore = create(
	persist<AuthState>(
		(set,get) => ({
			user: null,
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),
			isAuthenticated: () => get().user !== null,
	}),
	{
		name: "auth",
	}
)
)