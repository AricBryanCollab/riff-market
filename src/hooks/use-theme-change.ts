import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useThemeStore } from "@/store/theme";

const useThemeChange = () => {
	const { data: user } = useAuthUser();
	const previewTheme = useThemeStore((state) => state.previewTheme);
	const { cancelPreview, setTheme } = useThemeStore();

	useEffect(() => {
		if (user?.theme) {
			setTheme(user.theme);
		}
	}, [user?.theme, setTheme]);

	const themeValue = previewTheme || user?.theme || "light";

	const handleThemeSelectChange = (value: string) => {
		useThemeStore.getState().setPreviewTheme(value);
	};

	const handleUpdateTheme = () => {};

	const handleClearTheme = () => {
		cancelPreview();
	};

	return {
		themeValue,
		handleThemeSelectChange,
		handleUpdateTheme,
		handleClearTheme,
	};
};

export default useThemeChange;
