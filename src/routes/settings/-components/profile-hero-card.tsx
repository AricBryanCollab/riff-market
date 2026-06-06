import { Camera, Pencil } from "lucide-react";
import Avatar from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { BodySmall, H3 } from "@/components/ui/typography";
import type { UserProfile } from "@/types/user";

interface ProfileHeroCardProps {
	onEditProfile: () => void;
	onUpdateProfilePicture: () => void;
	roleDescription: string;
	roleLabel: string;
	user: UserProfile;
}

export function ProfileHeroCard({
	onEditProfile,
	onUpdateProfilePicture,
	roleDescription,
	roleLabel,
	user,
}: ProfileHeroCardProps) {
	return (
		<div className="grid gap-5 rounded-lg border border-border bg-background p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-5">
			<div className="relative w-fit">
				<Avatar size="lg" />
				<Button
					size="icon-sm"
					aria-label="Update profile picture"
					className="absolute right-0 bottom-0 rounded-full shadow-sm"
					onClick={onUpdateProfilePicture}
				>
					<Camera data-icon="inline-start" />
				</Button>
			</div>

			<div className="min-w-0">
				<H3 className="break-words text-2xl tracking-normal">
					{user.firstName} {user.lastName}
				</H3>
				<BodySmall className="mt-2 break-all text-muted-foreground leading-6">
					{roleLabel} · {user.email}
				</BodySmall>
				<BodySmall className="mt-1 max-w-2xl text-muted-foreground leading-6">
					{roleDescription}
				</BodySmall>
				<div className="mt-4 flex flex-col gap-2 sm:flex-row">
					<Button className="w-full sm:w-fit" onClick={onEditProfile}>
						<Pencil data-icon="inline-start" />
						Edit profile
					</Button>
					<Button
						variant="outline"
						className="w-full sm:w-fit"
						onClick={onUpdateProfilePicture}
					>
						<Camera data-icon="inline-start" />
						Photo
					</Button>
				</div>
			</div>
		</div>
	);
}
