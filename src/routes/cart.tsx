import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import CartCard from "@/components/cartcard";
import { CartDetailsLoadingState } from "@/components/loadingstates";
import SectionContainer from "@/components/sectioncontainer";
import { BodyLarge, BodySmall, H2 } from "@/components/typography";
import { Button } from "@/components/ui/button";
import useCartDetails from "@/hooks/useCartDetails";
import { requireRole } from "@/utils/requireRole";

export const Route = createFileRoute("/cart")({
	beforeLoad: () => requireRole(["CUSTOMER"]),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const {
		isCartEmpty,
		isLoading,
		totalPrice,
		cartCount,
		cartWithDetails,
		handleRemoveItem,
		handleQuantityChange,
	} = useCartDetails();

	if (isLoading) {
		return <CartDetailsLoadingState />;
	}

	return (
		<SectionContainer>
			<div className="my-6 relative flex items-center justify-center">
				<div className="absolute left-0 flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate({ to: "/shop" })}
						className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted-foreground transition-colors hover:bg-foreground hover:text-white"
					>
						<ArrowLeft size={28} />
					</button>
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
								${totalPrice}
							</BodyLarge>
						</div>
					</div>
				)}
			</div>

			{!isCartEmpty && (
				<div className=" w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Items in Your Cart</h2>
					<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{cartWithDetails.map((item) => (
							<CartCard
								key={item.productId}
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
					<Button onClick={() => navigate({ to: "/checkout" })}>
						Proceed To Checkout
					</Button>
				</div>
			)}
		</SectionContainer>
	);
}
