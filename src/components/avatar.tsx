import { useUserStore } from "@/store/user";

const Avatar = () => {
	const { user } = useUserStore();

	if (!user) return null;

	const getInitial = (name?: string) => {
		return name && name.length > 0 ? name.charAt(0).toUpperCase() : "";
	};

	const { firstName, lastName, profilePic } = user;

	const displayName = `${firstName} ${getInitial(lastName)}.`;

	return (
		<div className="flex items-center gap-3">
			<div className="relative">
				{profilePic ? (
					<img
						src={profilePic}
						alt={`${firstName}'s profile`}
						className="size-10 rounded-full object-cover border-2 border-primary"
					/>
				) : (
					<div className="flex size-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-lg">
						{getInitial(firstName)}
					</div>
				)}
			</div>
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
