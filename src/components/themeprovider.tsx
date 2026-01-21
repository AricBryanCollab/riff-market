import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: string;
}

export function ThemeProvider({
	children,
	defaultTheme = "default",
}: ThemeProviderProps) {
	const { theme, previewTheme, setTheme } = useThemeStore();

	useEffect(() => {
		if (!theme) {
			setTheme(defaultTheme);
		}
	}, [theme, defaultTheme, setTheme]);

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
