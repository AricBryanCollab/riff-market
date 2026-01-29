import { Package } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CartItem } from "@/types/cart";

interface OrderItemCardProps {
	isLoadingCart: boolean;
	cartWithDetails: CartItem[];
}

const OrderItemCard = ({
	isLoadingCart,
	cartWithDetails,
}: OrderItemCardProps) => {
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
				) : cartWithDetails.length === 0 ? (
					<p className="text-center text-muted-foreground py-8">
						Your cart is empty
					</p>
				) : (
					<div className="space-y-4">
						{cartWithDetails.map((item) => (
							<div
								key={item.product?.id}
								className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
							>
								<div className="size-20 bg-muted rounded-md flex items-center justify-center">
									<img
										src={item.product?.images?.[0]}
										alt={item.product?.name}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="grid grid-cols-2">
									<div className="flex flex-col gap-2">
										<h4 className="font-medium">{item.product?.name}</h4>
										<p className="text-sm text-muted-foreground">
											Quantity: {item.quantity}
										</p>
									</div>
									<div className="flex flex-col items-end gap-2">
										<p className="font-semibold">{item.product?.price}</p>
										<p className="text-sm text-muted-foreground">
											{(item.product?.price || 1) * item?.quantity}
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
