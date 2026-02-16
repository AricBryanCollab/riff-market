import { ClientOnly } from "@tanstack/react-router";
import { Bell, Package, PackageSearch, ShoppingCart } from "lucide-react";
import { AppDropdown } from "@/components/app-dropdown";
import Avatar from "@/components/avatar";
import CartList from "@/components/cart-list";
import NavbarIconButtons from "@/components/navbar-icon-buttons";
import NotificationList from "@/components/notification-list";
import OrderList from "@/components/order-list";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import useCartDetails from "@/hooks/use-cart-details";
import useGetOrders from "@/hooks/use-get-orders";
import useGetPendingProducts from "@/hooks/use-get-pending-products";
import useNotifications from "@/hooks/use-notifications";
import { useSignOut } from "@/hooks/use-sign-out";
import { useDialogStore } from "@/store/dialog";
import type { UserRole } from "@/types/enum";
import PendingProductList from "./pending-product-list";

const UserMenuFallback = () => (
	<div className="flex items-center gap-4" aria-hidden>
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-20 rounded-md" />
	</div>
);

const CustomerActions = () => {
	const {
		isCartEmpty,
		isLoading: isCartLoading,
		totalPrice,
		cartCount,
		cartWithDetails,
	} = useCartDetails();

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
};

const SellerActions = () => {
	const {
		orders,
		orderCount,
		isLoading: isLoadingOrders,
		isEmptyOrders,
	} = useGetOrders("SELLER");

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
				userRole="SELLER"
			/>
		</AppDropdown>
	);
};

const AdminActions = () => {
	const {
		pendingProducts,
		pendingProductCount,
		isLoadingPendingProducts,
		isEmptyPendingProducts,
	} = useGetPendingProducts();

	return (
		<AppDropdown
			trigger={
				<NavbarIconButtons
					icon={PackageSearch}
					count={pendingProductCount}
					ariaLabel="Pending Products"
				/>
			}
			align="end"
		>
			<PendingProductList
				pendingProducts={pendingProducts}
				pendingProductCount={pendingProductCount}
				isLoading={isLoadingPendingProducts}
				isEmptyPendingProducts={isEmptyPendingProducts}
			/>
		</AppDropdown>
	);
};

const RoleActions = ({ role }: { role: UserRole }) => {
	switch (role) {
		case "CUSTOMER":
			return <CustomerActions />;
		case "SELLER":
			return <SellerActions />;
		case "ADMIN":
			return <AdminActions />;
		default:
			return null;
	}
};

const NotificationsMenu = () => {
	const {
		notifications,
		isLoading: isLoadingNotification,
		unreadCount,
		isEmptyNotifications,
		markAsReadMutate,
	} = useNotifications();

	return (
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
				markAsRead={markAsReadMutate}
			/>
		</AppDropdown>
	);
};

const AuthenticatedUserMenu = ({ role }: { role: UserRole }) => {
	const { loading: signOutLoading, signOut } = useSignOut();

	return (
		<div className="flex items-center gap-4">
			<Avatar showInfo clickable />

			<RoleActions role={role} />

			<NotificationsMenu />

			<LoadingButton
				loading={signOutLoading}
				variant="outline"
				onClick={signOut}
			>
				Logout
			</LoadingButton>
		</div>
	);
};

const GuestUserMenu = () => {
	const { setOpenDialog } = useDialogStore();

	return (
		<div className="flex items-center gap-3">
			<Button onClick={() => setOpenDialog("signin")} variant="outline">
				Login
			</Button>
			<Button onClick={() => setOpenDialog("signup")}>Get Started</Button>
		</div>
	);
};

const UserMenu = () => {
	const { data: user } = useAuthUser();

	return (
		<ClientOnly fallback={<UserMenuFallback />}>
			{user ? <AuthenticatedUserMenu role={user.role} /> : <GuestUserMenu />}
		</ClientOnly>
	);
};

export default UserMenu;
