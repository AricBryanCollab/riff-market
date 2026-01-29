import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { BodySmall, H5 } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user";
import type { OrderStatus } from "@/types/enum";
import type { OrderResponse } from "@/types/order";

interface OrderListProps {
	orders: OrderResponse[];
	isLoading: boolean;
	isEmptyOrders: boolean;
}

const OrderList = ({ orders, isLoading, isEmptyOrders }: OrderListProps) => {
	const formatRelativeTime = (date: Date) => {
		return formatDistanceToNow(new Date(date), { addSuffix: true });
	};

	const userRole = useUserStore((state) => state.user?.role);

	const getStatusColor = (status: OrderStatus) => {
		const colors = {
			PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
			PROCESSING: "bg-blue-500/10 text-blue-700 border-blue-500/20",
			SHIPPED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
			DELIVERED: "bg-green-500/10 text-green-700 border-green-500/20",
			CANCELED: "bg-red-500/10 text-red-700 border-red-500/20",
		};
		return colors[status] || colors.PENDING;
	};

	if (isLoading) {
		return (
			<div className="w-80 max-w-sm bg-background">
				<div className="px-4 py-3 border-b border-border">
					<H5 className="font-semibold text-foreground">
						{userRole === "CUSTOMER" ? "My Orders" : "Sales Orders"}
					</H5>
				</div>
				<div className="max-h-96 overflow-y-auto px-4 py-3">
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
				<H5 className="font-semibold text-foreground">
					{userRole === "CUSTOMER" ? "My Orders" : "Sales Orders"}
				</H5>
				{!isEmptyOrders && (
					<BodySmall className="text-muted-foreground mt-0.5">
						{orders.length} {orders.length === 1 ? "order" : "orders"}
					</BodySmall>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{isEmptyOrders && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-3">
							<Package className="size-8 text-muted-foreground" />
						</div>
						<BodySmall className="text-muted-foreground">
							{userRole === "CUSTOMER"
								? "You have no orders yet"
								: "No sales orders yet"}
						</BodySmall>
						<BodySmall className="text-muted-foreground/70 text-xs mt-1">
							{userRole === "CUSTOMER"
								? "Start shopping to see your orders here"
								: "Orders will appear here when customers buy your products"}
						</BodySmall>
					</div>
				)}

				{!isEmptyOrders && (
					<ul className="space-y-2">
						{orders.slice(0, 5).map((order) => (
							<li
								key={order.id}
								className="p-3 rounded-lg transition-colors hover:bg-accent/50 border border-border"
							>
								<div className="space-y-2">
									{/* Order Header */}
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2 min-w-0">
											<ShoppingBag className="size-4 text-primary shrink-0" />
											<span className="text-sm font-medium truncate">
												#{order.trackingNumber}
											</span>
										</div>
										<Badge
											className={`flex items-center text-xs px-1 py-0.5 rounded-md shrink-0 ${getStatusColor(order.status)}`}
										>
											{order.status}
										</Badge>
									</div>

									{/* Customer Info (for sellers) */}
									{userRole !== "CUSTOMER" && order.customer && (
										<div className="text-xs text-muted-foreground">
											Customer: {order.customer.firstName}{" "}
											{order.customer.lastName}
										</div>
									)}

									{/* Order Items Preview */}
									{order.items && order.items.length > 0 && (
										<div className="flex gap-2 overflow-x-auto pb-1">
											{order.items.slice(0, 3).map((item) => (
												<div
													key={item.id}
													className="relative size-12 shrink-0 rounded bg-muted border border-border overflow-hidden"
												>
													{item.product.images?.[0] && (
														<img
															src={item.product.images[0]}
															alt={item.product.name}
															className="w-full h-full object-cover"
														/>
													)}
												</div>
											))}
											{order.items.length > 3 && (
												<div className="size-12 shrink-0 rounded bg-muted border border-border flex items-center justify-center">
													<span className="text-xs text-muted-foreground font-medium">
														+{order.items.length - 3}
													</span>
												</div>
											)}
										</div>
									)}

									{/* Order Details */}
									<div className="flex items-center justify-between pt-1">
										<div className="flex flex-col gap-0.5">
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(order.orderDate)}
											</span>
											{order.items && (
												<span className="text-xs text-muted-foreground">
													{order.items.length}{" "}
													{order.items.length === 1 ? "item" : "items"}
												</span>
											)}
										</div>
										<span className="text-sm font-semibold text-foreground">
											${order.totalAmount.toFixed(2)}
										</span>
									</div>
								</div>
							</li>
						))}

						{orders.length > 5 && (
							<div className="text-center pt-2 pb-1">
								<BodySmall className="text-muted-foreground/80 text-xs">
									+{orders.length - 5} more{" "}
									{orders.length - 5 === 1 ? "order" : "orders"}
								</BodySmall>
							</div>
						)}
					</ul>
				)}
			</div>

			{!isEmptyOrders && (
				<div className="px-4 py-3 border-t border-border bg-muted/30">
					<Button variant="ghost" className="w-full text-sm group">
						<span>View All Orders</span>
						<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
					</Button>
				</div>
			)}
		</div>
	);
};

export default OrderList;
