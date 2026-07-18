import { useNavigate, useParams } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Pencil, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import Counter from "@/components/counter";
import IconButton from "@/components/icon-button";
import { Button } from "@/components/ui/button";
import { BodySmall } from "@/components/ui/typography";
import {
	RoleActionConfigs,
	type RoleActionVariant,
} from "@/constants/role-action-configs";
import type { ActorRole } from "@/domains/shared/domain/actor";
import { useAuthUser } from "@/hooks/use-auth-user";
import useModerateListing from "@/hooks/use-moderate-listing";
import { useCartStore } from "@/store/cart";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";

const listingActionButtonVariants = cva(
	"rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors",
	{
		variants: {
			variant: {
				primary: "bg-primary hover:bg-accent text-white",
				secondary:
					"bg-slate-200 hover:bg-slate-300 text-slate-900 hover:text-slate-900",
				destructive:
					"bg-destructive hover:bg-rose-400 dark:hover:bg-rose-400 text-white",
				success: "bg-green-600 hover:bg-green-500 text-white",
			},
			width: {
				primary: "flex-1 h-12 text-white",
				secondary: "h-12 px-6",
			},
			disabled: {
				true: "bg-gray-300 cursor-not-allowed text-gray-500",
				false: "cursor-pointer",
			},
		},
		defaultVariants: {
			variant: "primary",
			width: "primary",
			disabled: false,
		},
	},
);

// Shop page actions at the right side of the header
interface ShopPageListingActionsProps {
	searchTerm: string;
	handleSearchTerm: (value: string) => void;
}

export function ShopPageListingActions({
	searchTerm,
	handleSearchTerm,
}: ShopPageListingActionsProps) {
	const { data: user } = useAuthUser();
	const navigate = useNavigate();
	const { setOpenDialog } = useDialogStore();
	const role = user?.role;

	const ButtonByRole = () => {
		switch (role) {
			case "ADMIN":
			case "SELLER":
				return (
					<Button onClick={() => navigate({ to: "/listing/new" })}>
						<div className="flex items-center gap-2">
							<Plus className="size-4" />
							<BodySmall>Add Listing</BodySmall>
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
					placeholder="Search listings"
					className="outline-none text-sm text-slate-700 placeholder:text-slate-400 bg-transparent w-48"
				/>
			</div>
			<div className="min-w-36">{ButtonByRole()}</div>
		</div>
	);
}

// Listing details actions by role and permissions
interface ListingDetailsActionsProps {
	quantity: number;
	stock: number;
	isOrderable: boolean;
	viewerCanEdit: boolean;
	viewerCanDelete: boolean;
	viewerCanApprove: boolean;
	viewerCanDecline: boolean;
	handleQuantityChange: (value: number) => void;
}

export function ListingDetailsActions({
	quantity,
	stock,
	isOrderable,
	handleQuantityChange,
	viewerCanEdit,
	viewerCanDelete,
	viewerCanApprove,
	viewerCanDecline,
}: ListingDetailsActionsProps) {
	const { data: user } = useAuthUser();
	const { showToast } = useToastStore();
	const addItem = useCartStore((state) => state.addItem);
	const updateQuantity = useCartStore((state) => state.updateQuantity);
	const { setOpenDialog } = useDialogStore();

	const { id } = useParams({ strict: false });
	const navigate = useNavigate();

	const { handleModerateListing, isListingModerationPending } =
		useModerateListing();

	const role: ActorRole = user?.role ?? "CUSTOMER";

	const actions = RoleActionConfigs[role] ?? RoleActionConfigs.CUSTOMER;
	const actionKeys = actions.map((action) => action.onClickKey);
	const showModifyIconActions =
		(viewerCanEdit || viewerCanDelete) &&
		!actionKeys.includes("edit") &&
		!actionKeys.includes("delete");
	const capabilities = {
		edit: viewerCanEdit,
		delete: viewerCanDelete,
		approve: viewerCanApprove,
		decline: viewerCanDecline,
		addToCart: isOrderable,
		toggleFavorite: true,
	};

	const handleAddToCart = () => {
		if (!id) {
			showToast("Listing ID not found", "error");
			return;
		}

		if (!user) {
			setOpenDialog("signup");
			return;
		}

		const existingQuantity =
			useCartStore.getState().items.find((item) => item.listingId === id)
				?.quantity ?? 0;
		const nextQuantity = Math.max(
			1,
			Math.min(existingQuantity + quantity, Math.max(stock, 1)),
		);

		if (existingQuantity > 0) {
			updateQuantity(id, nextQuantity);
			return;
		}

		addItem(id, user.id, role, nextQuantity);
	};

	const navigateToEditListing = () => {
		if (!id) {
			showToast("Listing ID not found", "error");
			return;
		}

		navigate({ to: "/listing/edit/$id", params: { id } });
	};

	const handleAction = (actionKey: string) => {
		if (!id) {
			showToast("Listing ID not found", "error");
			return;
		}

		switch (actionKey) {
			case "edit":
				if (!viewerCanEdit) {
					showToast("You are not allowed to modify this listing", "error");
					return;
				}

				navigateToEditListing();
				break;

			case "delete":
				if (!viewerCanDelete) {
					showToast("You are not allowed to modify this listing", "error");
					return;
				}

				setOpenDialog("deleteListing");
				break;

			case "addToCart":
				if (!isOrderable) {
					return;
				}

				handleAddToCart();
				break;

			case "toggleFavorite":
				// TODO: favorite logic
				break;

			case "approve":
				if (!viewerCanApprove || isListingModerationPending) {
					return;
				}

				handleModerateListing(id, true);
				break;

			case "decline":
				if (!viewerCanDecline || isListingModerationPending) {
					return;
				}

				handleModerateListing(id, false);
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
					const isPending =
						isListingModerationPending &&
						(action.onClickKey === "approve" ||
							action.onClickKey === "decline");
					const isActionAllowed = capabilities[action.onClickKey];
					const isButtonDisabled = isPending || !isActionAllowed;
					return (
						<button
							key={action.onClickKey}
							type="button"
							onClick={() => handleAction(action.onClickKey)}
							disabled={isButtonDisabled}
							title={
								!isActionAllowed &&
								(action.onClickKey === "edit" || action.onClickKey === "delete")
									? "You can only modify your own listings"
									: !isActionAllowed && action.onClickKey === "addToCart"
										? "Listing is not available for purchase"
										: !isActionAllowed &&
												(action.onClickKey === "approve" ||
													action.onClickKey === "decline")
											? "This listing cannot be moderated with this action"
											: undefined
							}
							className={listingActionButtonVariants({
								variant: action.variant as RoleActionVariant,
								width: isSecondary ? "secondary" : "primary",
								disabled: isButtonDisabled,
							})}
						>
							<Icon size={20} />
							{action.label}
						</button>
					);
				})}
				{showModifyIconActions && (
					<div className="absolute right-0 top-6 flex gap-4">
						<IconButton
							icon={Pencil}
							disabled={!viewerCanEdit}
							onClick={navigateToEditListing}
							backgroundColor="bg-primary hover:bg-accent hover:text-primary"
						/>
						<IconButton
							icon={Trash2}
							disabled={!viewerCanDelete}
							onClick={() => setOpenDialog("deleteListing")}
							backgroundColor="bg-destructive hover:bg-rose-400"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
