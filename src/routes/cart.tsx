import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/button";
import { CartDetailsLoadingState } from "@/components/loadingstates";
import SectionContainer from "@/components/sectioncontainer";
import { H2 } from "@/components/typography";
import useCartDetails from "@/hooks/useCartDetails";

export const Route = createFileRoute("/cart")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const {
		isCartEmpty,
		isLoading,
		totalPrice,
		totalItems,
		cartWithDetails,
		handleRemoveItem,
	} = useCartDetails();

	if (isLoading) {
		return <CartDetailsLoadingState />;
	}

	return (
		<SectionContainer>
			{/* HEADER ROW */}
			<div className="my-6 relative flex items-center justify-center">
				{/* BACK TO SHOP */}
				<div className="absolute left-0 flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate({ to: "/shop" })}
						className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted-foreground transition-colors hover:bg-foreground hover:text-white"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="font-medium">Back to Shop</p>
				</div>

				{/* CART SUMMARY TITLE */}
				<H2>Cart Summary</H2>
			</div>

			<div className="w-full rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
				{isCartEmpty ? (
					<div className="text-center py-8">
						<p className="text-gray-400 text-lg">Your cart is empty</p>
					</div>
				) : (
					<div className="space-y-3">
						<div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
							<span className="text-muted-foreground">Total Items</span>
							<span className="text-lg font-bold text-gray-900">
								{totalItems}
							</span>
						</div>

						<div className="flex justify-between items-center p-5 bg-linear-to-br from-primary to-secondary  rounded-xl text-white">
							<span className="font-semibold text-lg">Total Price</span>
							<span className="text-3xl font-bold">${totalPrice}</span>
						</div>
					</div>
				)}
			</div>

			{/* CART ITEMS */}
			{!isCartEmpty && (
				<div className="min-h-[50vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Items in Your Cart</h2>
					<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{cartWithDetails.map((item) => (
							<div
								key={item.productId}
								className="rounded-xl bg-slate-100 p-4 flex flex-col gap-2"
							>
								{item.product && (
									<>
										<div className="w-full rounded-lg bg-slate-300" />
										<img src={item.product.images[0]} alt="product-img" />
										<div className="text-lg font-semibold">
											{item.product.name}
										</div>
										<div className="text-sm text-gray-600">
											{item.product.brand}
										</div>
										<div className="flex justify-between items-center mt-2">
											<span className="text-md font-medium">
												$ {item.product.price}
											</span>
											<span className="text-sm text-gray-500">
												Qty: {item.quantity}
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleRemoveItem(item.productId)}
											className="mt-4 w-full rounded bg-amber-200 py-2 font-semibold hover:bg-amber-300 transition"
										>
											Remove
										</button>
									</>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* CHECKOUT */}
			{!isCartEmpty && (
				<div className="flex justify-end">
					<Button variant="primary">Proceed To Checkout</Button>
				</div>
			)}
		</SectionContainer>
	);
}
