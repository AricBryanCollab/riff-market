import { Bell, Package, PackageSearch, ShoppingCart } from "lucide-react";
import Avatar from "@/components/avatar";
import Button from "@/components/button";
import CartList from "@/components/cartlist";
import ClientOnly from "@/components/clientonly";
import Dropdown from "@/components/dropdown";
import NavbarIconButtons from "@/components/navbariconbuttons";
import useCartDetails from "@/hooks/useCartDetails";
import { useSignOut } from "@/hooks/useSignOut";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();
	const { user } = useUserStore();
	const { cartCount } = useCartDetails();
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
						<CartList />
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

	const notificationCount = 2;
	const orderCount = 2;
	const pendingApprovalCount = 4;

	return (
		<ClientOnly>
			{user !== null ? (
				<div className="flex items-center gap-4">
					<Avatar />

					{handleActionButtonsByRole(role)}

					<Dropdown
						trigger={
							<NavbarIconButtons
								icon={Bell}
								count={notificationCount}
								ariaLabel="Notifications"
							/>
						}
						align="right"
					>
						<CartList />
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

const DropdownContentPlaceholder = ({ title }: { title: string }) => {
	return (
		<div className="p-4">
			<h3 className="font-semibold mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground">Your items here</p>
		</div>
	);
};

export default UserMenu;
