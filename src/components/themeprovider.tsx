import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

interface ThemeProviderProps {
	children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const { theme, previewTheme } = useThemeStore();

	useEffect(() => {
		const root = document.documentElement;

		const themeClasses = [
			"light",
			"dark",
			"coffee",
			"forest",
			"ocean",
			"sunset",
			"crimson",
		];
		themeClasses.forEach((t) => {
			root.classList.remove(t);
		});

		const activeTheme = previewTheme || theme;

		if (activeTheme) {
			root.classList.add(activeTheme);
		}
	}, [theme, previewTheme]);

	return <>{children}</>;
}
