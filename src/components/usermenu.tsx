import { Bell, ShoppingCart } from "lucide-react";
import Avatar from "@/components/avatar";
import Button from "@/components/button";
import ClientOnly from "@/components/clientonly";
import Dropdown from "@/components/dropdown";
import { useSignOut } from "@/hooks/useSignOut";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";

interface CartButtonProps {
	cartCount: number;
}

interface NotificationButtonProps {
	notificationCount: number;
}

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
					<Dropdown
						trigger={<CartButton cartCount={cartCount} />}
						align="right"
					>
						<div className="p-4">
							<h3 className="font-semibold mb-2">Shopping Cart</h3>
							<p className="text-sm text-muted-foreground">
								Your cart items here
							</p>
						</div>
					</Dropdown>
					{/* Notifications with Badge */}
					<Dropdown
						trigger={
							<NotificationButton notificationCount={notificationCount} />
						}
						align="right"
					>
						<div className="p-4">
							<h3 className="font-semibold mb-2">Notifications</h3>
							<p className="text-sm text-muted-foreground">
								Your notifications here
							</p>
						</div>
					</Dropdown>

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

const CartButton = ({ cartCount }: CartButtonProps) => {
	return (
		<button
			type="button"
			className="relative cursor-pointer hover:bg-accent/20 rounded-full p-1"
		>
			<ShoppingCart size={24} className="text-primary" />
			{cartCount > 0 && (
				<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
					<span className="text-xs font-semibold text-white leading-none">
						{cartCount > 9 ? "9+" : cartCount}
					</span>
				</div>
			)}
			{cartCount > 0 && (
				<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
					<span className="text-xs font-semibold text-white leading-none">
						{cartCount > 9 ? "9+" : cartCount}
					</span>
				</div>
			)}
		</button>
	);
};

const NotificationButton = ({ notificationCount }: NotificationButtonProps) => {
	return (
		<button
			type="button"
			className="relative cursor-pointer hover:bg-accent/20 rounded-full p-1"
		>
			<Bell size={24} className="text-primary" />
			{notificationCount > 0 && (
				<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
					<span className="text-xs font-semibold text-white leading-none">
						{notificationCount > 9 ? "9+" : notificationCount}
					</span>
				</div>
			)}
			{notificationCount > 0 && (
				<div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500">
					<span className="text-xs font-semibold text-white leading-none">
						{notificationCount > 9 ? "9+" : notificationCount}
					</span>
				</div>
			)}
		</button>
	);
};

export default UserMenu;
