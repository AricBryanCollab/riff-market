import { Bell, ShoppingCart } from "lucide-react";
import Avatar from "@/components/avatar";
import Button from "@/components/button";
import ClientOnly from "@/components/clientonly";
import { useSignOut } from "@/hooks/useSignOut";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();
	const { user } = useUserStore();

	const { loading: signOutLoading, signOut } = useSignOut();

	const cartCount = 4;
	const notificationCount = 2;

	return (
		<ClientOnly>
			{user !== null ? (
				<div className="flex items-center gap-4">
					<Avatar />

					{/* Shopping Cart with Badge */}
					<button type="button" className="relative">
						<ShoppingCart size={24} className="text-primary" />
						{cartCount > 0 && (
							<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
								<span className="text-xs font-semibold text-white leading-none">
									{cartCount > 9 ? "9+" : cartCount}
								</span>
							</div>
						)}
					</button>

					{/* Notifications with Badge */}
					<button type="button" className="relative">
						<Bell size={24} className="text-primary" />
						{notificationCount > 0 && (
							<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
								<span className="text-xs font-semibold text-white leading-none">
									{notificationCount > 9 ? "9+" : notificationCount}
								</span>
							</div>
						)}
					</button>

					<Button loading={signOutLoading} variant="outline" action={signOut}>
						Logout
					</Button>
				</div>
			) : (
				<div className="flex items-center gap-3">
					<Button action={() => setOpenDialog("signin")} variant="outline">
						Login
					</Button>
					<Button action={() => setOpenDialog("signup")} variant="primary">
						Get Started
					</Button>
				</div>
			)}
		</ClientOnly>
	);
};

export default UserMenu;
