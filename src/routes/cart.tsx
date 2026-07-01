import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import CartCard from "@/components/cart-card";
import { CartDetailsLoadingState } from "@/components/loading-states";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { BodyLarge, BodySmall, H2 } from "@/components/ui/typography";
import useCartDetails from "@/hooks/use-cart-details";
import { formatMoneyAmountMinor } from "@/utils/format-money";
import { requireRole } from "@/utils/require-role";

export const Route = createFileRoute("/cart")({
	beforeLoad: async ({ context }) =>
		requireRole(context.queryClient, ["CUSTOMER"]),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const {
		isCartEmpty,
		isLoading,
		cartPricing,
		cartCount,
		cartLines,
		handleRemoveItem,
		handleQuantityChange,
	} = useCartDetails();
	const canCheckout = cartPricing.status === "priced";

	if (isLoading) {
		return <CartDetailsLoadingState />;
	}

	return (
		<SectionContainer>
			<div className="my-6 relative flex items-center justify-center">
				<div className="absolute left-0 flex items-center gap-3">
					<Button
						className="rounded-full size-10 cursor-pointer"
						onClick={() => navigate({ to: "/shop" })}
					>
						<ArrowLeft size={32} />
					</Button>
					<p className="hidden md:block">Back to Shop</p>
				</div>
				<H2>Cart Summary</H2>
			</div>

			<div className="w-full">
				{isCartEmpty ? (
					<div className="flex justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ShoppingCart size={28} />
						<p>Your Cart Is Empty</p>
					</div>
				) : (
					<div className="flex w-[50%] flex-col gap-4">
						<div className="flex w-full items-center justify-between rounded-xl  px-4 py-3">
							<BodySmall className="font-medium">Total Items</BodySmall>
							<BodyLarge className="font-bold text-primary">
								{cartCount}
							</BodyLarge>
						</div>

						<div className="flex w-full items-center justify-between rounded-xl border border-foreground px-2 py-3">
							<BodySmall className="font-semibold tracking-wide">
								Total Price
							</BodySmall>
							<BodyLarge className="font-extrabold leading-none">
								{cartPricing.status === "priced"
									? formatMoneyAmountMinor(
											cartPricing.totalPriceAmountMinor,
											cartPricing.currencyCode,
										)
									: cartPricing.message}
							</BodyLarge>
						</div>
					</div>
				)}
			</div>

			{!isCartEmpty && (
				<div className=" w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Items in Your Cart</h2>
					<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{cartLines.map((item) => (
							<CartCard
								key={item.listingId}
								cartItem={item}
								handleRemoveItem={handleRemoveItem}
								handleQuantityChange={handleQuantityChange}
							/>
						))}
					</div>
				</div>
			)}

			{!isCartEmpty && (
				<div className="flex justify-end">
					<Button
						disabled={!canCheckout}
						onClick={() => navigate({ to: "/checkout" })}
					>
						Proceed To Checkout
					</Button>
				</div>
			)}
		</SectionContainer>
	);
}
