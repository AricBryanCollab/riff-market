import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { Bell, Package, PackageSearch, ShoppingCart } from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AppDropdown } from "@/components/app-dropdown";
import Avatar from "@/components/avatar";
import NavbarIconButtons from "@/components/navbar-icon-buttons";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
	cartDetailsQueryOpt,
	default as useCartDetails,
} from "@/hooks/use-cart-details";
import {
	ordersByRoleQueryOpt,
	default as useGetOrders,
} from "@/hooks/use-get-orders";
import {
	pendingProductsQueryOpt,
	default as useGetPendingProducts,
} from "@/hooks/use-get-pending-products";
import { productCountByStatusQueryOpt } from "@/hooks/use-get-products";
import useNotifications, {
	notificationCountQueryOpt,
	notificationsQueryOpt,
} from "@/hooks/use-notifications";
import { useSignOut } from "@/hooks/use-sign-out";
import { useCartStore } from "@/store/cart";
import { useDialogStore } from "@/store/dialog";
import type { UserRole } from "@/types/enum";

const loadCartList = () => import("@/components/cart-list");
const loadOrderList = () => import("@/components/order-list");
const loadNotificationList = () => import("@/components/notification-list");
const loadPendingProductList = () => import("./pending-product-list");

const CartList = lazy(loadCartList);
const OrderList = lazy(loadOrderList);
const NotificationList = lazy(loadNotificationList);
const PendingProductList = lazy(loadPendingProductList);

const UserMenuFallback = () => (
	<div className="flex items-center gap-4" aria-hidden>
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-9 rounded-full" />
		<Skeleton className="h-9 w-20 rounded-md" />
	</div>
);

const DropdownContentFallback = () => (
	<div className="w-80 p-4 space-y-3">
		<Skeleton className="h-4 w-32" />
		<Skeleton className="h-16 w-full" />
		<Skeleton className="h-16 w-full" />
		<Skeleton className="h-9 w-full" />
	</div>
);

const CustomerActions = () => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const cartItems = useCartStore((state) => state.items);

	const cartCount = useMemo(
		() => cartItems.reduce((total, item) => total + item.quantity, 0),
		[cartItems],
	);

	const uniqueProductIds = useMemo(
		() => Array.from(new Set(cartItems.map((item) => item.productId))).sort(),
		[cartItems],
	);

	const {
		isCartEmpty,
		isLoading: isCartLoading,
		totalPrice,
		cartWithDetails,
	} = useCartDetails({ enabled: isOpen });

	const prefetchCart = useCallback(() => {
		void loadCartList();

		if (uniqueProductIds.length === 0) {
			return;
		}

		void queryClient.prefetchQuery(cartDetailsQueryOpt(uniqueProductIds));
	}, [queryClient, uniqueProductIds]);

	return (
		<AppDropdown
			trigger={
				<NavbarIconButtons
					icon={ShoppingCart}
					count={cartCount}
					ariaLabel="Shopping cart"
				/>
			}
			open={isOpen}
			onOpenChange={setIsOpen}
			onTriggerPointerEnter={prefetchCart}
			onTriggerFocus={prefetchCart}
			align="end"
		>
			{isOpen ? (
				<Suspense fallback={<DropdownContentFallback />}>
					<CartList
						isLoading={isCartLoading}
						isCartEmpty={isCartEmpty}
						totalPrice={totalPrice}
						cartCount={cartCount}
						cartWithDetails={cartWithDetails}
					/>
				</Suspense>
			) : null}
		</AppDropdown>
	);
};

const SellerActions = () => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const {
		orders,
		orderCount,
		isLoading: isLoadingOrders,
		isEmptyOrders,
	} = useGetOrders("SELLER", { enabled: true, polling: true });

	const prefetchOrders = useCallback(() => {
		void loadOrderList();
		void queryClient.prefetchQuery(ordersByRoleQueryOpt("SELLER"));
	}, [queryClient]);

	return (
		<AppDropdown
			trigger={
				<NavbarIconButtons
					icon={Package}
					count={orderCount}
					ariaLabel="Orders"
				/>
			}
			open={isOpen}
			onOpenChange={setIsOpen}
			onTriggerPointerEnter={prefetchOrders}
			onTriggerFocus={prefetchOrders}
			align="end"
		>
			{isOpen ? (
				<Suspense fallback={<DropdownContentFallback />}>
					<OrderList
						orders={orders}
						isLoading={isLoadingOrders}
						isEmptyOrders={isEmptyOrders}
						userRole="SELLER"
					/>
				</Suspense>
			) : null}
		</AppDropdown>
	);
};

const AdminActions = () => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { data: pendingProductCountData } = useQuery(
		productCountByStatusQueryOpt("pending"),
	);
	const pendingCount =
		pendingProductCountData && "pendingProductCount" in pendingProductCountData
			? pendingProductCountData.pendingProductCount
			: 0;

	const { pendingProducts, isLoadingPendingProducts, isEmptyPendingProducts } =
		useGetPendingProducts({ enabled: isOpen });

	const prefetchPendingProducts = useCallback(() => {
		void loadPendingProductList();
		void queryClient.prefetchQuery(productCountByStatusQueryOpt("pending"));
		void queryClient.prefetchQuery(pendingProductsQueryOpt);
	}, [queryClient]);

	return (
		<AppDropdown
			trigger={
				<NavbarIconButtons
					icon={PackageSearch}
					count={pendingCount}
					ariaLabel="Pending Products"
				/>
			}
			open={isOpen}
			onOpenChange={setIsOpen}
			onTriggerPointerEnter={prefetchPendingProducts}
			onTriggerFocus={prefetchPendingProducts}
			align="end"
		>
			{isOpen ? (
				<Suspense fallback={<DropdownContentFallback />}>
					<PendingProductList
						pendingProducts={pendingProducts}
						pendingProductCount={pendingCount}
						isLoading={isLoadingPendingProducts}
						isEmptyPendingProducts={isEmptyPendingProducts}
					/>
				</Suspense>
			) : null}
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
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { data: notificationCountData } = useQuery({
		...notificationCountQueryOpt,
		refetchInterval: 60000,
	});
	const unreadCount = notificationCountData?.count ?? 0;

	const {
		notifications,
		isLoading: isLoadingNotification,
		isEmptyNotifications,
		markAsReadMutate,
	} = useNotifications({ enabled: isOpen, polling: isOpen });

	const prefetchNotifications = useCallback(() => {
		void loadNotificationList();
		void queryClient.prefetchQuery(notificationCountQueryOpt);
		void queryClient.prefetchQuery(notificationsQueryOpt);
	}, [queryClient]);

	return (
		<AppDropdown
			trigger={
				<NavbarIconButtons
					icon={Bell}
					count={unreadCount}
					ariaLabel="Notifications"
				/>
			}
			open={isOpen}
			onOpenChange={setIsOpen}
			onTriggerPointerEnter={prefetchNotifications}
			onTriggerFocus={prefetchNotifications}
			align="end"
		>
			{isOpen ? (
				<Suspense fallback={<DropdownContentFallback />}>
					<NotificationList
						notifications={notifications}
						unreadCount={unreadCount}
						isLoading={isLoadingNotification}
						isEmptyNotifications={isEmptyNotifications}
						markAsRead={markAsReadMutate}
					/>
				</Suspense>
			) : null}
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
