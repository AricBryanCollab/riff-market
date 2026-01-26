import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "@/store/user";

interface AvatarProps {
	size?: "sm" | "md" | "lg" | "xl";
	showInfo?: boolean;
	className?: string;
	clickable?: boolean;
}

const Avatar = ({
	size = "md",
	showInfo = false,
	className = "",
	clickable = false,
}: AvatarProps) => {
	const { user } = useUserStore();
	const navigate = useNavigate();

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

	const avatarContent = profilePic ? (
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
	);

	const avatarElement = clickable ? (
		<button
			type="button"
			onClick={() => navigate({ to: "/settings" })}
			className={`relative cursor-pointer hover:scale-90 duration-300 ease-in-out ${className}`}
		>
			{avatarContent}
		</button>
	) : (
		<div className={`relative ${className}`}>{avatarContent}</div>
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
