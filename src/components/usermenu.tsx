import { Bell, ShoppingCart } from "lucide-react";
import Button from "@/components/button";
import { useDialogStore } from "@/store/dialog";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();

	const isAuthenticated = false;

	const cartCount = 4;
	const notificationCount = 2;

	return (
		<>
			{isAuthenticated ? (
				<div className="flex items-center gap-4">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white font-bold">
						R
					</div>

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

					<Button variant="outline">Logout</Button>
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
		</>
	);
};

export default UserMenu;
