import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { useEffect } from "react";
import Avatar from "@/components/avatar";
import Button from "@/components/button";
import { ProfileInfoField } from "@/components/profilefield";
import SectionContainer from "@/components/sectioncontainer";
import Select from "@/components/select";
import { BodyLarge, BodySmall, H2, H4 } from "@/components/typography";
import { themeOptions } from "@/constants/selectOptions";
import useThemeChange from "@/hooks/useThemeChange";
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
				{/* PAGE HEADER */}
				<div className="flex items-center justify-between my-6">
					<div className="py-2">
						<H2 className="text-3xl font-bold font-secondary tracking-wider">
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
						<Avatar size="xl" />
						<div className="grid grid-cols-2 min-w-xl lg:min-w-2xl gap-4">
							<ProfileInfoField label="First Name" value={user?.firstName} />
							<ProfileInfoField label="Last Name" value={user?.lastName} />
							<ProfileInfoField label="Email Address" value={user?.email} />
							<ProfileInfoField label="Address" value={user?.address} />
							<ProfileInfoField label="Phone Number" value={user?.phone} />
							<ProfileInfoField
								label="Community Role"
								value={roleInfo.label}
								description={roleInfo.description}
							/>
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
								<Select
									options={themeOptions.map((t) => ({
										label: t.label,
										value: t.value,
										icon: t.icon,
									}))}
									onChangeValue={handleThemeSelectChange}
									value={themeValue}
									width="w-[200px]"
								/>
								<div className="min-w-45">
									{previewTheme && (
										<div className="flex items-center gap-3">
											<Button variant="primary" action={() => {}}>
												Save
											</Button>
											<Button variant="outline" action={handleClearTheme}>
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
			</div>
		</SectionContainer>
	);
}
