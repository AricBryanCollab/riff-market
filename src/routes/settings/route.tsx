import { createFileRoute } from "@tanstack/react-router";
import { AppDialog } from "@/components/app-dialog";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { BodySmall, H2 } from "@/components/ui/typography";
import UpdateProfileForm from "@/components/user-settings/update-profile-form";
import { ordersByRoleQueryOpt } from "@/hooks/use-get-orders";
import { sellerProductsQueryOpt } from "@/hooks/use-get-products";
import { requireAuthUser } from "@/utils/require-role";
import { SettingsActivitySection } from "./-components/settings-activity-section";
import { ThemeSection } from "./-components/theme-section";
import { DeleteAccountDialog } from "./-components/delete-account-dialog";
import { ProfileHeroCard } from "./-components/profile-hero-card";
import { ProfilePictureDialog } from "./-components/profile-picture-dialog";
import { SettingsPanel } from "./-components/settings-panel";
import { SettingsProfileDetailsList } from "./-components/settings-summary-lists";
import { useSettingsPage } from "./-hooks/use-settings-page";

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

		if (context.user.role === "SELLER") {
			await context.queryClient
				.ensureQueryData({
					...sellerProductsQueryOpt,
					revalidateIfStale: true,
				})
				.catch(() => undefined);
		}
	},
	component: SettingsComponent,
});

function SettingsComponent() {
	const settingsPage = useSettingsPage();
	const { user } = settingsPage;

	if (!user) return null;

	return (
		<SectionContainer>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10">
				<header className="border-b border-border pb-6">
					<div>
						<H2 className="text-3xl font-semibold tracking-normal md:text-4xl">
							Settings
						</H2>
						<BodySmall className="mt-3 max-w-2xl text-muted-foreground leading-6">
							Keep the essentials current: identity, contact details, theme, and
							account actions.
						</BodySmall>
					</div>
				</header>

				<ProfileHeroCard
					user={user}
					roleLabel={settingsPage.role.label}
					roleDescription={settingsPage.role.description}
					onEditProfile={settingsPage.actions.openEditProfile}
					onUpdateProfilePicture={settingsPage.actions.openProfilePicture}
				/>

				<SettingsPanel
					title="Profile"
					description="Used for orders, seller communication, and account recovery."
				>
					<SettingsProfileDetailsList
						roleLabel={settingsPage.role.label}
						user={user}
					/>
				</SettingsPanel>

				<ThemeSection {...settingsPage.theme} />

				<SettingsActivitySection userRole={user.role} />

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
							onClick={settingsPage.actions.openDeleteAccount}
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
