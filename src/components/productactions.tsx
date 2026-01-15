import { useNavigate } from "@tanstack/react-router";
import { Heart, Plus, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import Button from "@/components/button";
import { BodySmall } from "@/components/typography";
import { useDialogStore } from "@/store/dialog";
import { useUserStore } from "@/store/user";

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
	handleQuantityChange: (quantity: number) => void;
}

export function ProductDetailsActions({
	quantity,
	stock,
	handleQuantityChange,
}: ProductDetailsActionsProps) {
	return (
		<div className="my-2">
			{/* QUANTITY SELECTOR */}
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-gray-700">Quantity:</span>
				<div className="flex items-center border-2 border-slate-300 rounded-lg overflow-hidden">
					<button
						type="button"
						onClick={() => handleQuantityChange(-1)}
						disabled={quantity <= 1}
						className="h-10 w-12 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold"
					>
						−
					</button>
					<div className="h-10 w-16 border-x-2 border-slate-300 bg-white flex items-center justify-center font-medium">
						{quantity}
					</div>
					<button
						type="button"
						onClick={() => handleQuantityChange(1)}
						disabled={quantity >= stock}
						className="h-10 w-12 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold"
					>
						+
					</button>
				</div>
			</div>

			{/* ACTION BUTTONS */}
			<div className="flex gap-4 pt-4">
				<button
					type="button"
					disabled={stock === 0}
					className="flex-1 h-12 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
				>
					<ShoppingCart size={20} />
					Add to Cart
				</button>
				<button
					type="button"
					className="h-12 px-6 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold transition-colors"
				>
					<Heart />
				</button>
			</div>
		</div>
	);
}
