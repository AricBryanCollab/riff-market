import type { UserProfile } from "@/types/user";

interface SettingsSummaryItem {
	label: string;
	value: string;
}

interface SettingsProfileDetailsOptions {
	roleLabel: string;
	user: UserProfile;
}

export function getSettingsProfileDetails({
	roleLabel,
	user,
}: SettingsProfileDetailsOptions): SettingsSummaryItem[] {
	return [
		{ label: "First name", value: user.firstName },
		{ label: "Last name", value: user.lastName },
		{ label: "Email", value: user.email },
		{ label: "Address", value: user.address || "Not provided" },
		{ label: "Phone", value: user.phone || "Not provided" },
		{ label: "Role", value: roleLabel },
	];
}
