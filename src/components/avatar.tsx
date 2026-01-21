import { useUserStore } from "@/store/user";

interface AvatarProps {
	size?: "sm" | "md" | "lg" | "xl";
	showInfo?: boolean;
	className?: string;
}

const Avatar = ({
	size = "md",
	showInfo = false,
	className = "",
}: AvatarProps) => {
	const { user } = useUserStore();

	if (!user) return null;

	const getInitial = (name?: string) => {
		return name && name.length > 0 ? name.charAt(0).toUpperCase() : "";
	};

	const { firstName, lastName, profilePic } = user;
	const displayName = `${firstName} ${getInitial(lastName)}.`;

	const sizeClasses = {
		sm: "size-8 text-sm",
		md: "size-10 text-lg",
		lg: "size-16 text-2xl",
		xl: "size-28 text-3xl",
	};

	const avatarElement = (
		<div className={`relative ${className}`}>
			{profilePic ? (
				<img
					src={profilePic}
					alt={`${firstName}'s profile`}
					className={`${sizeClasses[size]} rounded-full object-cover border-2 border-primary`}
				/>
			) : (
				<div
					className={`flex ${sizeClasses[size]} items-center justify-center rounded-full bg-primary text-white font-semibold`}
				>
					{getInitial(firstName)}
				</div>
			)}
		</div>
	);

	if (!showInfo) {
		return avatarElement;
	}

	return (
		<div className="flex items-center gap-3">
			{avatarElement}
			<div className="flex flex-col">
				<span className="text-xs text-muted-foreground">Logged in as:</span>
				<span className="text-sm font-semibold text-primary">
					{displayName}
				</span>
			</div>
		</div>
	);
};

export default Avatar;
