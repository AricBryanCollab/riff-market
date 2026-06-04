import { createFileRoute } from "@tanstack/react-router";
import { AppDialog } from "@/components/app-dialog";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { BodySmall, H2 } from "@/components/ui/typography";
import UpdateProfileForm from "@/components/user-settings/update-profile-form";
import { themeOptions } from "@/constants/select-options";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ordersByRoleQueryOpt } from "@/hooks/use-get-orders";
import useThemeChange from "@/hooks/use-theme-change";
import { useDialogStore } from "@/store/dialog";
import { useThemeStore } from "@/store/theme";
import { getRoleInfo, requireAuthUser } from "@/utils/require-role";
import { AppearanceSection } from "./-components/appearance-section";
import { DeleteAccountDialog } from "./-components/delete-account-dialog";
import { ProfileHeroCard } from "./-components/profile-hero-card";
import { ProfilePictureDialog } from "./-components/profile-picture-dialog";
import { SettingsOrdersSection } from "./-components/settings-orders-section";
import { SettingsPanel } from "./-components/settings-panel";
import {
	SettingsCompletionList,
	SettingsProfileDetailsList,
} from "./-components/settings-summary-lists";

export const Route = createFileRoute("/settings")({
	beforeLoad: async ({ context }) => {
		const user = await requireAuthUser(context.queryClient, "/unauthorized");

		return { user };
	},
	loader: async ({ context }) => {
		if (context.user.role !== "CUSTOMER" && context.user.role !== "SELLER") {
			return;
		}

		await context.queryClient
			.ensureQueryData({
				...ordersByRoleQueryOpt(context.user.role),
				revalidateIfStale: true,
			})
			.catch(() => undefined);
	},
	component: SettingsComponent,
});

function SettingsComponent() {
	const { data: user } = useAuthUser();
	const { setOpenDialog } = useDialogStore();
	const { previewTheme } = useThemeStore();
	const {
		themeValue,
		handleThemeSelectChange,
		handleUpdateTheme,
		handleClearTheme,
		loadingUpdateTheme,
	} = useThemeChange();

	if (!user) return null;

	const roleInfo = getRoleInfo(user.role);
	const savedThemeLabel =
		themeOptions.find((theme) => theme.value === user.theme)?.label ?? "Light";
	const selectedThemeLabel =
		themeOptions.find((theme) => theme.value === themeValue)?.label ??
		savedThemeLabel;

	return (
		<SectionContainer>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10">
				<header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
					<div>
						<H2 className="text-3xl font-semibold tracking-normal md:text-4xl">
							Settings
						</H2>
						<BodySmall className="mt-3 max-w-2xl text-muted-foreground leading-6">
							Keep the essentials current: identity, contact details, theme, and
							account actions.
						</BodySmall>
					</div>
					<SettingsCompletionList user={user} />
				</header>

				<ProfileHeroCard
					user={user}
					roleLabel={roleInfo.label}
					roleDescription={roleInfo.description}
					onEditProfile={() => setOpenDialog("updateUser")}
					onUpdateProfilePicture={() => setOpenDialog("updateProfilePic")}
				/>

				<SettingsPanel
					title="Profile"
					description="Used for orders, seller communication, and account recovery."
				>
					<SettingsProfileDetailsList roleLabel={roleInfo.label} user={user} />
				</SettingsPanel>

				<AppearanceSection
					themeValue={themeValue}
					selectedThemeLabel={selectedThemeLabel}
					savedThemeLabel={savedThemeLabel}
					previewTheme={previewTheme}
					loadingUpdateTheme={loadingUpdateTheme}
					onThemeSelectChange={handleThemeSelectChange}
					onUpdateTheme={handleUpdateTheme}
					onClearTheme={handleClearTheme}
				/>

				<SettingsOrdersSection userRole={user.role} />

				<SettingsPanel
					title="Account"
					description="Permanent account-level actions."
					tone="warning"
				>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<BodySmall className="max-w-xl text-muted-foreground leading-6">
							Delete your profile, saved settings, and account activity tied to
							this sign-in.
						</BodySmall>
						<Button
							variant="destructive"
							className="w-full sm:w-fit"
							onClick={() => setOpenDialog("deleteUser")}
						>
							Delete account
						</Button>
					</div>
				</SettingsPanel>

				<AppDialog type="updateUser" title="Update your profile information">
					<UpdateProfileForm />
				</AppDialog>

				<AppDialog type="updateProfilePic" title="Upload your profile picture">
					<ProfilePictureDialog />
				</AppDialog>

				<AppDialog type="deleteUser" title="Delete your account">
					<DeleteAccountDialog user={user} />
				</AppDialog>
			</div>
		</SectionContainer>
	);
}
