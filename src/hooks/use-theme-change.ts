import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { clientLogger } from "@/lib/client-logger";
import { setCurrentUserCache } from "@/lib/tanstack-query/cache-policy";
import { updateCurrentUserFn } from "@/server/user.functions";
import { useThemeStore } from "@/store/theme";
import { useToastStore } from "@/store/toast";

const useThemeChange = () => {
	const queryClient = useQueryClient();
	const { data: user } = useAuthUser();
	const previewTheme = useThemeStore((state) => state.previewTheme);
	const { cancelPreview, commitPreview, setTheme } = useThemeStore();
	const { showToast } = useToastStore();

	useEffect(() => {
		if (user?.theme) {
			setTheme(user.theme);
		}
	}, [user?.theme, setTheme]);

	const themeValue = previewTheme || user?.theme || "light";

	const handleThemeSelectChange = (value: string) => {
		if (value === user?.theme) {
			cancelPreview();
			return;
		}

		useThemeStore.getState().setPreviewTheme(value);
	};

	const {
		mutate,
		isPending: loadingUpdateTheme,
		isError: errorUpdateTheme,
	} = useMutation({
		mutationFn: (theme: string) => updateCurrentUserFn({ data: { theme } }),
		onSuccess: (updatedUser) => {
			setCurrentUserCache(queryClient, updatedUser);
			commitPreview();
			showToast("Your theme has been saved", "success");
		},
		onError: (error) => {
			clientLogger.error("Failed to update theme", error);
			const message =
				error instanceof Error ? error.message : "Failed to update your theme";
			showToast(message, "error");
		},
	});

	const handleUpdateTheme = () => {
		if (!previewTheme) return;

		mutate(previewTheme);
	};

	const handleClearTheme = () => {
		cancelPreview();
	};

	return {
		themeValue,
		handleThemeSelectChange,
		handleUpdateTheme,
		handleClearTheme,
		loadingUpdateTheme,
		errorUpdateTheme,
	};
};

export default useThemeChange;
