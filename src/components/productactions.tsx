import { useNavigate, useParams } from "@tanstack/react-router";
import { Plus, Search, ShoppingBag } from "lucide-react";
import Button from "@/components/button";
import Counter from "@/components/counter";
import { BodySmall } from "@/components/typography";
import { ButtonStyles, RoleActionConfigs } from "@/constants/roleactionconfigs";
import useUpdateProductStatus from "@/hooks/useUpdateProductStatus";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";

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
					<Button
						action={() => navigate({ from: "/product/new" })}
						variant="primary"
					>
						<div className="flex items-center gap-2">
							<Plus className="size-4" />
							<BodySmall>Add Product</BodySmall>
						</div>
					</Button>
				);
			case "CUSTOMER":
				return (
					<Button variant="primary">
						<div className="flex items-center gap-2">
							<ShoppingBag className="size-4" />
							<BodySmall>My Orders</BodySmall>
						</div>
					</Button>
				);
			default:
				return (
					<Button action={() => setOpenDialog("signup")} variant="primary">
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

interface ProductDetailsActionsProps {
	quantity: number;
	stock: number;
	handleQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductDetailsActions({
	quantity,
	stock,
	handleQuantityChange,
}: ProductDetailsActionsProps) {
	const { user } = useUserStore();
	const { setOpenDialog } = useDialogStore();
	const { id } = useParams({ strict: false });
	const { handleUpdateProductStatus, isPending } = useUpdateProductStatus();

	const navigate = useNavigate();
	const role = user?.role || "CUSTOMER";

	const actions =
		RoleActionConfigs[role as UserRole] || RoleActionConfigs.CUSTOMER;

	const handleAction = (actionType: string) => {
		if (!id) {
			console.error("Product ID not found");
			return;
		}

		switch (actionType) {
			case "edit":
				navigate({ from: "/product/edit/$id" });
				break;
			case "delete":
				setOpenDialog("deleteProduct");
				break;
			case "addToCart":
				break;
			case "toggleFavorite":
				// Todo: toggle favorite feature
				break;
			case "approve":
				handleUpdateProductStatus(id, true);
				break;
			case "decline":
				handleUpdateProductStatus(id, false);
				break;
			default:
				return null;
		}
	};

	return (
		<div className="my-2">
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
					const isDisabled = action.requiresStock && stock === 0;
					const isSecondary = action.variant === "secondary";

					return (
						<button
							key={action.label}
							type="button"
							onClick={() => handleAction(action.onClickKey)}
							disabled={isDisabled || isPending}
							className={`
								${isSecondary ? "h-12 px-6" : "flex-1 h-12"} 
								rounded-lg cursor-pointer font-semibold flex items-center justify-center gap-2 transition-colors
								${
									isDisabled
										? "bg-gray-300 cursor-not-allowed"
										: ButtonStyles[action.variant]
								}
								${isSecondary ? "" : "text-white"}
							`}
						>
							<Icon size={20} />
							{action.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
