import type { UserProfile } from "@/types/user";
import {
	getSettingsCompletionItems,
	getSettingsProfileDetails,
} from "../-utils/settings-profile-summary";

export function SettingsCompletionList({ user }: { user: UserProfile }) {
	const completionItems = getSettingsCompletionItems(user);

	return (
		<dl className="grid grid-cols-3 gap-3 text-sm lg:grid-cols-1">
			{completionItems.map(({ label, value }) => (
				<div key={label} className="min-w-0 border-l border-border pl-3">
					<dt className="text-muted-foreground">{label}</dt>
					<dd className="mt-1 truncate font-medium">{value}</dd>
				</div>
			))}
		</dl>
	);
}

export function SettingsProfileDetailsList({
	roleLabel,
	user,
}: {
	roleLabel: string;
	user: UserProfile;
}) {
	const profileDetails = getSettingsProfileDetails({
		roleLabel,
		user,
	});

	return (
		<dl className="divide-y divide-border">
			{profileDetails.map(({ label, value }) => (
				<div
					key={label}
					className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
				>
					<dt className="text-sm text-muted-foreground">{label}</dt>
					<dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
				</div>
			))}
		</dl>
	);
}
