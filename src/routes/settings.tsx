import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import SectionContainer from "@/components/sectioncontainer";
import { useUserStore } from "@/store/user";
import { getRoleInfo, requireRole } from "@/utils/requireRole";

export const Route = createFileRoute("/settings")({
	beforeLoad: () => requireRole(["ADMIN", "SELLER", "CUSTOMER"]),
	component: SettingsComponent,
});

import Avatar from "@/components/avatar";
import { ProfileInfoField } from "@/components/profilefield";
import { BodySmall, H2, H4 } from "@/components/typography";

function SettingsComponent() {
	const { user } = useUserStore();
	const navigate = useNavigate();

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
				<div className="flex items-center justify-between rounded-2xl bg-white p-6">
					<div>
						<H2 className="text-3xl font-bold font-secondary tracking-wider">
							Account Settings
						</H2>
						<BodySmall>
							Manage your profile, preferences, and activity
						</BodySmall>
					</div>
					<div className="flex flex-col items-center">
						<H4>
							{user?.firstName} {user?.lastName}
						</H4>
					</div>
				</div>

				{/* PROFILE */}
				<div className="rounded-2xl bg-white p-6">
					<h2 className="mb-6 text-xl font-semibold">Profile Information</h2>
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
				<div className="rounded-2xl bg-slate-50 p-6">
					<h2 className="mb-6 text-xl font-semibold">Preferences</h2>
					<div className="grid gap-6 md:grid-cols-2">
						<div className="h-12 rounded bg-slate-200" />
						<div className="h-12 rounded bg-slate-200" />
						<div className="h-12 rounded bg-slate-200" />
						<div className="h-12 rounded bg-slate-200" />
					</div>
				</div>

				{/* SECURITY */}
				<div className="rounded-2xl bg-white p-6">
					<h2 className="mb-6 text-xl font-semibold">Security</h2>
					<div className="space-y-4">
						<div className="h-12 rounded bg-slate-200" />
						<div className="h-12 rounded bg-slate-200" />
					</div>
				</div>

				{/* ORDERS */}
				<div className="rounded-2xl bg-slate-50 p-6">
					<h2 className="mb-6 text-xl font-semibold">Recent Orders</h2>
					<div className="space-y-3">
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
						<div className="h-16 rounded bg-slate-200" />
					</div>
				</div>

				{/* REVIEWS */}
				<div className="rounded-2xl bg-white p-6">
					<h2 className="mb-6 text-xl font-semibold">Your Reviews</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="h-24 rounded bg-slate-200" />
						<div className="h-24 rounded bg-slate-200" />
					</div>
				</div>

				{/* NOTIFICATIONS */}
				<div className="rounded-2xl bg-slate-50 p-6">
					<h2 className="mb-6 text-xl font-semibold">Notifications</h2>
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
