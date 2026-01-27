import { Bell, Package, PackageSearch, ShoppingCart } from "lucide-react";
import Avatar from "@/components/avatar";
import CartList from "@/components/cartlist";
import ClientOnly from "@/components/clientonly";
import Dropdown from "@/components/dropdown";
import NavbarIconButtons from "@/components/navbariconbuttons";
import NotificationList from "@/components/notificationlist";
import { BodySmall } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import useCartDetails from "@/hooks/useCartDetails";
import { useSignOut } from "@/hooks/useSignOut";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();
	const { user } = useUserStore();
	const {
		isCartEmpty,
		isLoading: isCartLoading,
		totalPrice,
		cartCount,
		cartWithDetails,
	} = useCartDetails();
	const role = user?.role || "CUSTOMER";

	const { loading: signOutLoading, signOut } = useSignOut();

	const handleActionButtonsByRole = (role: UserRole) => {
		switch (role) {
			case "CUSTOMER":
				return (
					<Dropdown
						trigger={
							<NavbarIconButtons
								icon={ShoppingCart}
								count={cartCount}
								ariaLabel="Shopping cart"
							/>
						}
						align="right"
					>
						{isCartEmpty ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="rounded-full bg-muted p-4 mb-3">
									<ShoppingCart className="size-8 text-muted-foreground" />
								</div>
								<BodySmall className="text-muted-foreground">
									Your cart is empty
								</BodySmall>
								<BodySmall className="text-muted-foreground/70 text-xs mt-1">
									Add items to get started
								</BodySmall>
							</div>
						) : (
							<CartList
								isLoading={isCartLoading}
								isCartEmpty={isCartEmpty}
								totalPrice={totalPrice}
								cartCount={cartCount}
								cartWithDetails={cartWithDetails}
							/>
						)}
					</Dropdown>
				);
			case "SELLER":
				return (
					<Dropdown
						trigger={
							<NavbarIconButtons
								icon={Package}
								count={orderCount}
								ariaLabel="Orders"
							/>
						}
						align="right"
					>
						<DropdownContentPlaceholder title="Products Ordered" />
					</Dropdown>
				);
			case "ADMIN":
				return (
					<Dropdown
						trigger={
							<NavbarIconButtons
								icon={PackageSearch}
								count={pendingApprovalCount}
								ariaLabel="Pending Products"
							/>
						}
						align="right"
					>
						<DropdownContentPlaceholder title="Pending Products" />
					</Dropdown>
				);
			default:
				return null;
		}
	};

	const orderCount = 2;
	const pendingApprovalCount = 4;

	return (
		<ClientOnly>
			{user !== null ? (
				<div className="flex items-center gap-4">
					<Avatar showInfo clickable />

					{handleActionButtonsByRole(role)}

					<Dropdown
						trigger={
							<NavbarIconButtons
								icon={Bell}
								count={2}
								ariaLabel="Notifications"
							/>
						}
						align="right"
					>
						<NotificationList />
					</Dropdown>

					<LoadingButton
						loading={signOutLoading}
						variant="outline"
						onClick={signOut}
					>
						Logout
					</LoadingButton>
				</div>
			) : (
				<div className="flex items-center gap-3">
					<Button onClick={() => setOpenDialog("signin")} variant="outline">
						Login
					</Button>
					<Button onClick={() => setOpenDialog("signup")}>Get Started</Button>
				</div>
			)}
		</ClientOnly>
	);
};

const DropdownContentPlaceholder = ({ title }: { title: string }) => {
	return (
		<div className="p-4">
			<h3 className="font-semibold mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground">Your items here</p>
		</div>
	);
};

export default UserMenu;
