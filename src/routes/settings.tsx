import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Palette, Pencil } from "lucide-react";
import { useEffect } from "react";
import { AppDialog } from "@/components/app-dialog";
import Avatar from "@/components/avatar";
import { FormSelect } from "@/components/form-select";
import IconButton from "@/components/iconbutton";
import SectionContainer from "@/components/sectioncontainer";
import { Button } from "@/components/ui/button";
import { BodyLarge, BodySmall, H2, H4 } from "@/components/ui/typography";
import { ProfileInfoField } from "@/components/usersettings/profilefield";
import UpdateProfileForm from "@/components/usersettings/updateprofileform";
import { themeOptions } from "@/constants/selectOptions";
import useThemeChange from "@/hooks/useThemeChange";
import { useDialogStore } from "@/store/dialog";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import { getRoleInfo } from "@/utils/requireRole";

export const Route = createFileRoute("/settings")({
	beforeLoad: () => {
		const user = useUserStore.getState().user;
		if (!user) {
			throw redirect({ to: "/" });
		}
	},
	component: SettingsComponent,
});

function SettingsComponent() {
	const { user } = useUserStore();
	const { setOpenDialog } = useDialogStore();
	const navigate = useNavigate();
	const { previewTheme } = useThemeStore();
	const { themeValue, handleThemeSelectChange, handleClearTheme } =
		useThemeChange();

	useEffect(() => {
		if (!user) {
			navigate({ to: "/unauthorized" });
		}
	}, [user, navigate]);

	if (!user) return null;
	const roleInfo = getRoleInfo(user?.role);

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
				<div className="flex flex-col gap-4">
					<H4>Profile Information</H4>
					<div className="flex flex-col gap-6 md:flex-row">
						{/* Avatar Group */}
						<div className="group relative">
							<div className="border-2 border-dashed border-transparent group-hover:border-black ease-in-out duration-300 p-3 rounded-full">
								<Avatar size="xl" />
							</div>
							<div className="absolute top-30 right-2 hidden group-hover:block ease-in-out duration-300">
								<IconButton
									icon={Pencil}
									onClick={() => setOpenDialog("updateProfilePic")}
								/>
							</div>
						</div>

						{/* Profile Info Group */}
						<div className="group relative">
							<div className="border-2 border-dashed border-transparent group-hover:border-black ease-in-out duration-300 px-3 py-4 rounded-md">
								<div className="grid grid-cols-2 min-w-xl lg:min-w-2xl gap-4">
									<ProfileInfoField
										label="First Name"
										value={user?.firstName}
									/>
									<ProfileInfoField label="Last Name" value={user?.lastName} />
									<ProfileInfoField label="Email Address" value={user?.email} />
									<ProfileInfoField label="Address" value={user?.address} />
									<ProfileInfoField label="Phone Number" value={user?.phone} />
									<ProfileInfoField
										label="Marketplace Role"
										value={roleInfo.label}
										description={roleInfo.description}
									/>
								</div>

								<div className="absolute right-4 top-2 hidden group-hover:block ease-in-out duration-300">
									<IconButton
										icon={Pencil}
										onClick={() => setOpenDialog("updateUser")}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* PREFERENCES */}
				<div className="flex flex-col gap-4">
					<H4>Preferences</H4>
					<div className="flex flex-col">
						<div className="flex justify-between max-w-xl items-center gap-4">
							<div className="flex items-center gap-3">
								<Palette size={18} />
								<BodyLarge>Theme</BodyLarge>
							</div>
							<div className="flex flex-col md:flex-row items-center gap-3">
								<FormSelect
									options={themeOptions.map((t) => ({
										label: t.label,
										value: t.value,
									}))}
									onValueChange={handleThemeSelectChange}
									value={themeValue}
									className="w-50"
								/>
								<div className="min-w-45">
									{previewTheme && (
										<div className="flex items-center gap-3">
											<Button onClick={() => {}}>Save</Button>
											<Button variant="outline" onClick={handleClearTheme}>
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

				{/* ORDERS */}
				<div className="flex flex-col gap-4">
					<H4>Recent Orders</H4>
					<div className="space-y-3">
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
					</div>
				</div>

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
