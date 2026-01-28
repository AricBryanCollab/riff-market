import { Bell, Package, PackageSearch, ShoppingCart } from "lucide-react";
import { AppDropdown } from "@/components/app-dropdown";
import Avatar from "@/components/avatar";
import CartList from "@/components/cartlist";
import ClientOnly from "@/components/clientonly";
import NavbarIconButtons from "@/components/navbariconbuttons";
import NotificationList from "@/components/notificationlist";
import OrderList from "@/components/orderlist";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import useCartDetails from "@/hooks/useCartDetails";
import useGetOrders from "@/hooks/useGetOrders";
import useNotifications from "@/hooks/useNotifications";
import { useSignOut } from "@/hooks/useSignOut";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();
	const { user } = useUserStore();
	const role = user?.role || "CUSTOMER";

	// Use CartList Hook
	const {
		isCartEmpty,
		isLoading: isCartLoading,
		totalPrice,
		cartCount,
		cartWithDetails,
	} = useCartDetails();

	// Use Notification List
	const {
		notifications,
		isLoading: isLoadingNotification,
		unreadCount,
		isEmptyNotifications,
		markAsRead,
	} = useNotifications();

	// Use Order List
	const {
		orders,
		isLoading: isLoadingOrders,
		isEmptyOrders,
	} = useGetOrders(role);

	const { loading: signOutLoading, signOut } = useSignOut();

	const handleActionButtonsByRole = (role: UserRole) => {
		switch (role) {
			case "CUSTOMER":
				return (
					<AppDropdown
						trigger={
							<NavbarIconButtons
								icon={ShoppingCart}
								count={cartCount}
								ariaLabel="Shopping cart"
							/>
						}
						align="end"
					>
						<CartList
							isLoading={isCartLoading}
							isCartEmpty={isCartEmpty}
							totalPrice={totalPrice}
							cartCount={cartCount}
							cartWithDetails={cartWithDetails}
						/>
					</AppDropdown>
				);
			case "SELLER":
				return (
					<AppDropdown
						trigger={
							<NavbarIconButtons
								icon={Package}
								count={orderCount}
								ariaLabel="Orders"
							/>
						}
						align="end"
					>
						<OrderList
							orders={orders}
							isLoading={isLoadingOrders}
							isEmptyOrders={isEmptyOrders}
						/>
					</AppDropdown>
				);
			case "ADMIN":
				return (
					<AppDropdown
						trigger={
							<NavbarIconButtons
								icon={PackageSearch}
								count={pendingApprovalCount}
								ariaLabel="Pending Products"
							/>
						}
						align="end"
					>
						<DropdownContentPlaceholder title="Pending Products" />
					</AppDropdown>
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

					<AppDropdown
						trigger={
							<NavbarIconButtons
								icon={Bell}
								count={unreadCount}
								ariaLabel="Notifications"
							/>
						}
						align="end"
					>
						<NotificationList
							notifications={notifications}
							unreadCount={unreadCount}
							isLoading={isLoadingNotification}
							isEmptyNotifications={isEmptyNotifications}
							markAsRead={markAsRead}
						/>
					</AppDropdown>

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
