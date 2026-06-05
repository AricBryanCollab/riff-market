import { themeOptions } from "@/constants/select-options";
import { useAuthUser } from "@/hooks/use-auth-user";
import useThemeChange from "@/hooks/use-theme-change";
import { useDialogStore } from "@/store/dialog";
import { useThemeStore } from "@/store/theme";
import { getRoleInfo } from "@/utils/require-role";

function getThemeLabel(value: string | null | undefined) {
	return themeOptions.find((theme) => theme.value === value)?.label;
}

function useSettingsDialogs() {
	const { setOpenDialog } = useDialogStore();

	return {
		openEditProfile: () => setOpenDialog("updateUser"),
		openProfilePicture: () => setOpenDialog("updateProfilePic"),
		openDeleteAccount: () => setOpenDialog("deleteUser"),
	};
}

function useSettingsTheme(userTheme: string | null | undefined) {
	const { previewTheme } = useThemeStore();
	const {
		themeValue,
		handleThemeSelectChange,
		handleUpdateTheme,
		handleClearTheme,
		loadingUpdateTheme,
	} = useThemeChange();

	const savedThemeLabel = getThemeLabel(userTheme) ?? "Light";
	const selectedThemeLabel =
		getThemeLabel(themeValue) ?? savedThemeLabel;

	return {
		themeValue,
		selectedThemeLabel,
		savedThemeLabel,
		previewTheme,
		loadingUpdateTheme,
		onThemeSelectChange: handleThemeSelectChange,
		onUpdateTheme: handleUpdateTheme,
		onClearTheme: handleClearTheme,
	};
}

export function useSettingsPage() {
	const { data: user } = useAuthUser();
	const dialogs = useSettingsDialogs();
	const theme = useSettingsTheme(user?.theme);
	const roleInfo = getRoleInfo(user?.role);

	return {
		user,
		role: {
			label: roleInfo.label,
			description: roleInfo.description,
		},
		theme,
		actions: dialogs,
	};
}
