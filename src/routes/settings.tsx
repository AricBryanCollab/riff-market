import { createFileRoute } from "@tanstack/react-router";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/settings")({
	component: SettingsComponent,
});

function SettingsComponent() {
	return (
		<SectionContainer>
			<div className="flex w-full flex-col gap-8">
				{/* PAGE HEADER */}
				<div className="flex items-center justify-between rounded-2xl bg-white p-6">
					<div>
						<h1 className="text-3xl font-bold font-secondary tracking-wider">
							Account Settings
						</h1>
						<p className="mt-1 text-slate-500">
							Manage your profile, preferences, and activity
						</p>
					</div>
					<div className="h-14 w-32 rounded-full bg-slate-200" />
				</div>

				{/* PROFILE */}
				<div className="rounded-2xl bg-white p-6">
					<h2 className="mb-6 text-xl font-semibold">Profile Information</h2>
					<div className="flex flex-col gap-6 md:flex-row">
						<div className="h-28 w-28 rounded-full bg-slate-200" />
						<div className="flex-1 space-y-3">
							<div className="h-4 w-1/3 rounded bg-slate-300" />
							<div className="h-4 w-1/2 rounded bg-slate-200" />
							<div className="h-4 w-2/3 rounded bg-slate-200" />
						</div>
					</div>
				</div>

				{/* PREFERENCES */}
				<div className="rounded-2xl bg-slate-50 p-6">
					<h2 className="mb-6 text-xl font-semibold">Preferences</h2>
					<div className="grid gap-4 md:grid-cols-2">
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
