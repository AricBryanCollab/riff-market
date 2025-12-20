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
	const { theme, setTheme } = useThemeStore();

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

		if (theme) {
			root.classList.add(theme);
		}
	}, [theme]);

	return <>{children}</>;
}
