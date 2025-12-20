import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
	theme: string;
	setTheme: (theme: string) => void;
}

export const useThemeStore = create(
	persist<ThemeState>(
		(set) => ({
			theme: "light",

			setTheme: (theme) => set({ theme }),
		}),
		{
			name: "theme",
		},
	),
);
