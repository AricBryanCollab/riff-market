import { useNavigate, useParams } from "@tanstack/react-router";
import { Pencil, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import Counter from "@/components/counter";
import IconButton from "@/components/iconbutton";
import { BodySmall } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ButtonStyles, RoleActionConfigs } from "@/constants/roleactionconfigs";
import useUpdateProductStatus from "@/hooks/useUpdateProductStatus";
import { useCartStore } from "@/store/cart";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";
import { canModifyProduct, isActionDisabled } from "@/utils/canModifyProduct";

//  Shop Page Actions at the right side of the header
interface ShopPageProductActionsProps {
	searchTerm: string;
	handleSearchTerm: (value: string) => void;
}

export function ShopPageProductActions({
	searchTerm,
	handleSearchTerm,
}: ShopPageProductActionsProps) {
	const { user } = useUserStore();
	const navigate = useNavigate();
	const { setOpenDialog } = useDialogStore();
	const role = user?.role;

	const ButtonByRole = () => {
		switch (role) {
			case "ADMIN":
			case "SELLER":
				return (
					<Button onClick={() => navigate({ from: "/product/new" })}>
						<div className="flex items-center gap-2">
							<Plus className="size-4" />
							<BodySmall>Add Product</BodySmall>
						</div>
					</Button>
				);
			case "CUSTOMER":
				return (
					<Button>
						<div className="flex items-center gap-2">
							<ShoppingBag className="size-4" />
							<BodySmall>My Orders</BodySmall>
						</div>
					</Button>
				);
			default:
				return (
					<Button onClick={() => setOpenDialog("signup")}>
						<p className="flex items-center gap-2">Register Now</p>
					</Button>
				);
		}
	};

	return (
		<div className="flex flex-col md:flex-row items-center gap-2">
			<div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
				<Search className="h-4 w-4 text-slate-400" />
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => handleSearchTerm(e.target.value)}
					placeholder="Search products"
					className="outline-none text-sm text-slate-700 placeholder:text-slate-400 bg-transparent w-48"
				/>
			</div>
			<div className="min-w-36">{ButtonByRole()}</div>
		</div>
	);
}

// Product Details Actions Button By Role and Permissions
interface ProductDetailsActionsProps {
	quantity: number;
	stock: number;
	sellerId: string;
	isApproved: boolean;
	handleQuantityChange: (value: number) => void;
}

export function ProductDetailsActions({
	quantity,
	stock,
	sellerId,
	handleQuantityChange,
	isApproved,
}: ProductDetailsActionsProps) {
	const { user } = useUserStore();
	const { showToast } = useToastStore();
	const { addItem } = useCartStore();
	const { setOpenDialog } = useDialogStore();

	const { id } = useParams({ strict: false });
	const navigate = useNavigate();

	const { handleUpdateProductStatus, isPending } = useUpdateProductStatus();

	const role: UserRole = user?.role ?? "CUSTOMER";

	const canEditOrDelete = canModifyProduct(user, sellerId);

	const actions = RoleActionConfigs[role] ?? RoleActionConfigs.CUSTOMER;

	const handleAddToCart = () => {
		if (!id) {
			showToast("Product ID not found", "error");
			return;
		}

		if (!user) {
			setOpenDialog("signup");
			return;
		}

		addItem(id, user.id, role, quantity);
		navigate({ from: "/cart" });
	};

	const handleAction = (actionKey: string) => {
		if (!id) {
			showToast("Product ID not found", "error");
			return;
		}

		switch (actionKey) {
			case "edit":
			case "delete":
				if (!canEditOrDelete) {
					showToast("You are not allowed to modify this product", "error");
					return;
				}

				if (actionKey === "edit") {
					navigate({ from: "/product/edit/$id" });
				} else {
					setOpenDialog("deleteProduct");
				}
				break;

			case "addToCart":
				handleAddToCart();
				break;

			case "toggleFavorite":
				// TODO: favorite logic
				break;

			case "approve":
				handleUpdateProductStatus(id, true);
				break;

			case "decline":
				handleUpdateProductStatus(id, false);
				break;

			default:
				return;
		}
	};

	return (
		<div className="relative my-2">
			<Counter
				inputId="quantity"
				label="Quantity"
				value={quantity}
				onChange={handleQuantityChange}
				min={1}
				max={stock}
				showLimit={false}
			/>

			<div className="flex gap-4 my-4">
				{actions.map((action) => {
					const Icon = action.icon;
					const isSecondary = action.variant === "secondary";

					const isOutOfStock = action.requiresStock && stock === 0;

					const permissionDisabled = isActionDisabled(
						action.onClickKey,
						canEditOrDelete,
						isPending,
						isApproved,
					);

					const isButtonDisabled = isOutOfStock || permissionDisabled;
					return (
						<button
							key={action.label}
							type="button"
							onClick={() => handleAction(action.onClickKey)}
							disabled={isButtonDisabled}
							title={
								!canEditOrDelete &&
								(action.onClickKey === "edit" || action.onClickKey === "delete")
									? "You can only modify your own products"
									: isApproved &&
											(action.onClickKey === "approve" ||
												action.onClickKey === "decline")
										? "Product is already approved"
										: undefined
							}
							className={`
								${isSecondary ? "h-12 px-6" : "flex-1 h-12"}
								rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors
								${
									isButtonDisabled
										? "bg-gray-300 cursor-not-allowed text-gray-500"
										: `${ButtonStyles[action.variant]} cursor-pointer ${
												isSecondary ? "" : "text-white"
											}`
								}
							`}
						>
							<Icon size={20} />
							{action.label}
						</button>
					);
				})}
				{role === "ADMIN" && (
					<div className="absolute right-0 top-6 flex gap-4">
						<IconButton
							icon={Pencil}
							disabled={isPending || !canEditOrDelete}
							onClick={() => navigate({ from: "/product/edit/$id" })}
							backgroundColor="bg-primary hover:bg-accent hover:text-primary"
						/>
						<IconButton
							icon={Trash2}
							disabled={isPending || !canEditOrDelete}
							onClick={() => setOpenDialog("deleteProduct")}
							backgroundColor="bg-destructive hover:bg-rose-400"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
