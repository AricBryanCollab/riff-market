import { Package } from "lucide-react";
import AnimatedLoader from "@/components/animated-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CartDetail } from "@/types/cart";

interface OrderItemCardProps {
	isLoadingCart: boolean;
	cartDetails: CartDetail[];
}

const OrderItemCard = ({ isLoadingCart, cartDetails }: OrderItemCardProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Package className="w-5 h-5" />
					Order Items
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoadingCart ? (
					<div className="flex items-center justify-center py-8">
						<AnimatedLoader
							svgSize={100}
							pingSize="size-28"
							textSize="text-lg"
							containerSizeClass="w-fit min-h-fit mx-auto py-8"
						/>
					</div>
				) : cartDetails.length === 0 ? (
					<p className="text-center text-muted-foreground py-8">
						Your cart is empty
					</p>
				) : (
					<div className="space-y-4">
						{cartDetails.map((item) => (
							<div
								key={item.listingId}
								className="flex items-center gap-4 p-2 rounded-xl bg-muted/50"
							>
								<div className="size-20 bg-muted rounded-sm flex items-center justify-center">
									{item.imageUrl && (
										<img
											src={item.imageUrl}
											alt={item.imageAlt}
											className="w-full h-full object-cover rounded-sm outline -outline-offset-1 outline-black/10 dark:outline-white/10"
										/>
									)}
								</div>
								<div className="grid grid-cols-2">
									<div className="flex flex-col gap-2">
										<h4 className="font-medium">{item.title}</h4>
										<p className="text-sm text-muted-foreground tabular-nums">
											Quantity: {item.quantity}
										</p>
									</div>
									<div className="flex flex-col items-end gap-2 tabular-nums">
										<p className="font-semibold">{item.unitPriceText}</p>
										<p className="text-sm text-muted-foreground">
											{item.subtotalText}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default OrderItemCard;
