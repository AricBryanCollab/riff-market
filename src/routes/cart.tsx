import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import SectionContainer from "@/components/sectioncontainer";
import { requireRole } from "@/utils/requireRole";

export const Route = createFileRoute("/cart")({
	beforeLoad: () => requireRole(["CUSTOMER"]),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const cartItems = Array.from({ length: 4 }).map((_, i) => ({
		id: i,
		name: `Product ${i + 1}`,
		brand: "Brand Name",
		price: `$${(i + 1) * 99}`,
		quantity: i + 1,
	}));

	const isCartEmpty = cartItems.length === 0;

	return (
		<SectionContainer>
			<div className="flex w-full flex-col gap-8">
				{/* BACK TO SHOP */}
				<div className="flex items-center gap-3 rounded-2xl bg-white p-4">
					<button
						type="button"
						onClick={() => navigate({ to: "/shop" })}
						className="size-10 flex justify-center cursor-pointer items-center rounded-full bg-muted-foreground hover:bg-foreground hover:text-white transition-colors"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="font-medium">Back to Shop</p>
				</div>
			</div>

			<div className=" w-full rounded-2xl bg-white p-8">
				<h2 className="mb-4 text-2xl font-semibold">Cart Summary</h2>
				{isCartEmpty ? (
					<p className="text-gray-500">Your cart is empty.</p>
				) : (
					<div className="flex flex-col gap-2">
						<div className="flex justify-between">
							<span>Total Items:</span>
							<span>
								{cartItems.reduce((sum, item) => sum + item.quantity, 0)}
							</span>
						</div>
						<div className="flex justify-between font-bold">
							<span>Total Price:</span>
							<span>
								$
								{cartItems
									.reduce(
										(sum, item) =>
											sum + item.quantity * parseInt(item.price.slice(1), 10),
										0,
									)
									.toFixed(2)}
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="min-h-[50vh] w-full rounded-2xl bg-white p-8">
				<h2 className="mb-6 text-2xl font-semibold">Items in Your Cart</h2>
				{isCartEmpty ? (
					<div className="text-center text-gray-500 py-10">
						No items added yet. Browse products to add them to your cart.
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{cartItems.map((item) => (
							<div
								key={item.id}
								className="rounded-xl bg-slate-100 p-4 flex flex-col gap-2"
							>
								<div className="h-32 w-full rounded-lg bg-slate-300" />{" "}
								{/* product image */}
								<div className="text-lg font-semibold">{item.name}</div>
								<div className="text-sm text-gray-600">{item.brand}</div>
								<div className="flex justify-between items-center mt-2">
									<span className="text-md font-medium">{item.price}</span>
									<span className="text-sm text-gray-500">
										Qty: {item.quantity}
									</span>
								</div>
								<button
									type="button"
									className="mt-4 w-full rounded bg-amber-200 py-2 font-semibold"
								>
									Remove
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* CHECKOUT */}
			{!isCartEmpty && (
				<div className="flex justify-end">
					<button
						type="button"
						className="rounded-xl bg-emerald-400 px-6 py-3 text-white font-bold hover:bg-emerald-500 transition"
					>
						Proceed to Checkout
					</button>
				</div>
			)}
		</SectionContainer>
	);
}
