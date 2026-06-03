import { createFileRoute } from "@tanstack/react-router";
import {
	AtSign,
	Camera,
	MapPin,
	Pencil,
	Phone,
	RotateCcw,
	Save,
	ShieldCheck,
	UserRound,
} from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import Avatar from "@/components/avatar";
import { FormSelect } from "@/components/form-select";
import SectionContainer from "@/components/section-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BodyLarge, BodySmall, H2, H4 } from "@/components/ui/typography";
import { ProfileInfoField } from "@/components/user-settings/profile-field";
import UpdateProfileForm from "@/components/user-settings/update-profile-form";
import { themeOptions } from "@/constants/select-options";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ordersByRoleQueryOpt } from "@/hooks/use-get-orders";
import useThemeChange from "@/hooks/use-theme-change";
import { useDialogStore } from "@/store/dialog";
import { useThemeStore } from "@/store/theme";
import { getRoleInfo, requireAuthUser } from "@/utils/require-role";
import { SettingsOrdersSection } from "./settings/-components/settings-orders-section";

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

	const roleInfo = getRoleInfo(user?.role);
	const savedThemeLabel =
		themeOptions.find((theme) => theme.value === user.theme)?.label ?? "Light";
	const selectedThemeLabel =
		themeOptions.find((theme) => theme.value === themeValue)?.label ??
		savedThemeLabel;

	return (
		<SectionContainer>
			<div className="flex w-full flex-col gap-8">
				<div className="flex items-center justify-between my-6">
					<div className="py-2">
						<H2 className="text-3xl font-bold tracking-wider">
							Account Settings
						</H2>
						<BodySmall className="mt-3 text-muted-foreground">
							Manage your profile, preferences, and activity
						</BodySmall>
					</div>
				</div>

				{/* PROFILE */}
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-1">
						<H4>Profile Information</H4>
						<BodySmall className="text-muted-foreground">
							Your public identity and account contact details.
						</BodySmall>
					</div>
					<div className="flex flex-col gap-6 border-y border-border py-6">
						<div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
								<div className="relative w-fit">
									<Avatar size="xl" />
									<Button
										size="icon-sm"
										aria-label="Update profile picture"
										className="absolute right-0 bottom-0 rounded-full"
										onClick={() => setOpenDialog("updateProfilePic")}
									>
										<Camera />
									</Button>
								</div>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<H2 className="text-2xl">
											{user.firstName} {user.lastName}
										</H2>
										<Badge variant="secondary">{roleInfo.label}</Badge>
									</div>
									<BodySmall className="mt-2 break-all text-muted-foreground">
										{user.email}
									</BodySmall>
									<BodySmall className="mt-2 max-w-xl text-muted-foreground">
										{roleInfo.description}
									</BodySmall>
								</div>
							</div>
							<Button
								variant="outline"
								className="w-full sm:w-fit"
								onClick={() => setOpenDialog("updateUser")}
							>
								<Pencil />
								Edit Profile
							</Button>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<ProfileInfoField
								icon={UserRound}
								label="First Name"
								value={user.firstName}
							/>
							<ProfileInfoField
								icon={UserRound}
								label="Last Name"
								value={user.lastName}
							/>
							<ProfileInfoField
								icon={AtSign}
								label="Email Address"
								value={user.email}
							/>
							<ProfileInfoField
								icon={MapPin}
								label="Address"
								value={user.address}
							/>
							<ProfileInfoField
								icon={Phone}
								label="Phone Number"
								value={user.phone}
							/>
							<ProfileInfoField
								icon={ShieldCheck}
								label="Marketplace Role"
								value={roleInfo.label}
							/>
						</div>
					</div>
				</div>

				{/* PREFERENCES */}
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-1">
						<H4>Preferences</H4>
						<BodySmall className="text-muted-foreground">
							Account defaults for your browsing experience.
						</BodySmall>
					</div>
					<div className="flex flex-col gap-4 border-y border-border py-6">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<BodyLarge className="text-base">Theme</BodyLarge>
									<Badge variant={previewTheme ? "outline" : "secondary"}>
										{previewTheme ? "Preview" : "Saved"}
									</Badge>
								</div>
								<BodySmall className="mt-2 text-muted-foreground">
									{previewTheme
										? `${selectedThemeLabel} selected. Saved: ${savedThemeLabel}.`
										: `${savedThemeLabel} is saved.`}
								</BodySmall>
							</div>
							<div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
								<FormSelect
									options={themeOptions.map((t) => ({
										label: t.label,
										value: t.value,
									}))}
									onValueChange={handleThemeSelectChange}
									value={themeValue}
									className="w-full md:w-48"
								/>
								<div className="min-h-9 min-w-0 md:min-w-48">
									{previewTheme && (
										<div className="flex flex-col gap-2 sm:flex-row">
											<Button
												disabled={loadingUpdateTheme}
												className="w-full sm:w-fit"
												onClick={handleUpdateTheme}
											>
												<Save />
												Save
											</Button>
											<Button
												variant="outline"
												className="w-full sm:w-fit"
												onClick={handleClearTheme}
											>
												<RotateCcw />
												Cancel
											</Button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SECURITY */}
				<div className="flex flex-col gap-4">
					<H4>Security</H4>
					<div className="flex justify-between max-w-xl items-center gap-4">
						<div className="">
							<BodyLarge>Reset Password</BodyLarge>
						</div>
						<div className="">
							<BodyLarge>Email Notifications</BodyLarge>
						</div>
					</div>
				</div>

				<SettingsOrdersSection userRole={user.role} />

				{/* Favorites */}
				<div className="flex flex-col gap-4">
					<H4>Your Product Favorites</H4>
					<div className="space-y-3">
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
					</div>
				</div>

				{/* REVIEWS */}
				<div className="flex flex-col gap-4">
					<H4>Your Reviews</H4>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="h-24 rounded bg-slate-200" />
						<div className="h-24 rounded bg-slate-200" />
					</div>
				</div>

				{/* NOTIFICATIONS */}
				<div className="flex flex-col gap-4">
					<H4>Notifications</H4>
					<div className="space-y-3">
						<div className="h-14 rounded bg-slate-200" />
						<div className="h-14 rounded bg-slate-200" />
						<div className="h-14 rounded bg-slate-200" />
					</div>
				</div>

				{/* DANGER ZONE */}
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6">
					<h2 className="mb-4 text-xl font-semibold text-red-600">
						Danger Zone
					</h2>
					<div className="flex gap-4">
						<div className="h-10 w-40 rounded bg-red-300" />
						<div className="h-10 w-40 rounded bg-red-200" />
					</div>
				</div>

				<AppDialog type="updateUser" title="Update your profile information">
					<UpdateProfileForm />
				</AppDialog>

				<AppDialog type="updateProfilePic" title="Upload your profile picture">
					<h1>Test for Upload Profile Picture Dialog</h1>
				</AppDialog>
			</div>
		</SectionContainer>
	);
}
