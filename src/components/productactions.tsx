import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, ShoppingBag } from "lucide-react";
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
