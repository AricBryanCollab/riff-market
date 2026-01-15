import { useNavigate } from "@tanstack/react-router";
import {
	CheckCircle,
	Heart,
	Pencil,
	Plus,
	Search,
	ShoppingBag,
	ShoppingCart,
	Trash2,
	XCircle,
} from "lucide-react";
import Button from "@/components/button";
import { Counter } from "@/components/counter";
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
	handleQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductDetailsActions({
	quantity,
	stock,
	handleQuantityChange,
}: ProductDetailsActionsProps) {
	const { user } = useUserStore();
	const role = user?.role;

	const ActionButtonsByRole = () => {
		switch (role) {
			case "CUSTOMER":
				return (
					<>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-primary hover:bg-accent disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
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
					</>
				);
			case "SELLER":
				return (
					<>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-primary hover:bg-accent disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
						>
							<Pencil size={20} />
							Edit
						</button>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-destructive hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
						>
							<Trash2 size={20} />
							Delete
						</button>
					</>
				);
			case "ADMIN":
				return (
					<>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-success hover:bg-emerald-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
						>
							<CheckCircle size={20} />
							Accept
						</button>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-destructive hover:bg-rose-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
						>
							<XCircle size={20} />
							Decline
						</button>
					</>
				);
			default:
				return (
					<>
						<button
							type="button"
							disabled={stock === 0}
							className="flex-1 h-12 rounded-lg cursor-pointer bg-primary hover:bg-accent disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
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
					</>
				);
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

			<div className="flex gap-4 my-4">{ActionButtonsByRole()}</div>
		</div>
	);
}
