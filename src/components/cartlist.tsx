import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { Button } from "@/components/ui/button";
import { BodySmall, H5 } from "@/components/ui/typography";
import type { CartItem } from "@/types/cart";

interface CartListProps {
	isLoading: boolean;
	isCartEmpty: boolean;
	totalPrice: number;
	cartCount: number;
	cartWithDetails: CartItem[];
}

const CartList = ({
	isLoading,
	isCartEmpty,
	totalPrice,
	cartCount,
	cartWithDetails,
}: CartListProps) => {
	if (isLoading) {
		return (
			<div className="w-80 max-w-sm bg-background">
				<div className="max-h-96 overflow-y-auto px-4 py-3">
					<H5 className="font-semibold text-foreground">Shopping Cart</H5>
					<AnimatedLoader
						svgSize={80}
						pingSize="size-24"
						textSize="text-base"
						containerSizeClass="w-fit min-h-fit mx-auto py-8"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="w-80 max-w-sm bg-background">
			<div className="px-4 py-3 border-b border-border">
				<H5 className="font-semibold text-foreground">Shopping Cart</H5>
				{!isCartEmpty && (
					<BodySmall className="text-muted-foreground mt-0.5">
						{cartCount} {cartCount === 1 ? "item" : "items"}
					</BodySmall>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{isCartEmpty && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-3">
							<ShoppingBag className="size-8 text-muted-foreground" />
						</div>
						<BodySmall className="text-muted-foreground">
							Cart is Empty
						</BodySmall>
						<BodySmall className="text-muted-foreground/70 text-xs mt-1">
							View the shop to add some
						</BodySmall>
					</div>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{!isLoading && !isCartEmpty && (
					<ul className="space-y-3">
						{cartWithDetails.slice(0, 3).map((cart) => (
							<li
								key={cart.product?.id}
								className="flex gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
							>
								{cart.product?.images?.[0] && (
									<div className="relative size-20 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
										<img
											src={cart.product?.images?.[0]}
											alt={cart.product.name}
											className="w-full h-full object-cover"
										/>
									</div>
								)}
								<div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
									<div>
										<p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
											{cart.product?.name}
										</p>
										<p className="text-xs text-muted-foreground mt-0.5 truncate">
											{cart.product?.brand} • {cart.product?.model}
										</p>
									</div>
									<div className="flex items-center justify-between mt-1">
										<BodySmall className="text-muted-foreground">
											Qty: {cart.quantity}
										</BodySmall>
										<p className="text-sm font-semibold text-foreground">
											${cart.product?.price.toFixed(2)}
										</p>
									</div>
								</div>
							</li>
						))}
						{cartWithDetails.length > 3 && (
							<div className="text-center pt-1 pb-1">
								<BodySmall className="text-muted-foreground/80 text-xs">
									+{cartWithDetails.length - 3} more{" "}
									{cartWithDetails.length - 3 === 1 ? "item" : "items"}
								</BodySmall>
							</div>
						)}
					</ul>
				)}
			</div>

			{!isCartEmpty && (
				<div className="px-4 py-3 border-t border-border bg-muted/30">
					<div className="flex justify-between items-center mb-3">
						<span className="text-sm font-medium text-muted-foreground">
							Subtotal:
						</span>
						<span className="text-lg font-bold text-foreground">
							${totalPrice.toFixed(2)}
						</span>
					</div>
					<Button>
						<Link
							to="/cart"
							className="flex items-center justify-center gap-2 w-full"
						>
							<span>View Full Cart</span>
							<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
};

export default CartList;
