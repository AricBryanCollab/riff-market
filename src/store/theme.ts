import { create } from "zustand";

interface ThemeState {
	theme: string;
	previewTheme: string | null;
	setTheme: (theme: string) => void;
	setPreviewTheme: (theme: string) => void;
	cancelPreview: () => void;
	commitPreview: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: "light",
	previewTheme: null,

	setTheme: (theme) => set({ theme, previewTheme: null }),
	setPreviewTheme: (theme) => set({ previewTheme: theme }),
	cancelPreview: () => set({ previewTheme: null }),
	commitPreview: () => {
		const { previewTheme } = get();
		if (previewTheme) {
			set({ theme: previewTheme, previewTheme: null });
		}
	},
}));
