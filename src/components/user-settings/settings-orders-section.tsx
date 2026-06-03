import { AlertCircle, Package, ShoppingBag } from "lucide-react";
import AnimatedLoader from "@/components/animated-loader";
import { Badge } from "@/components/ui/badge";
import { BodyLarge, BodySmall, H4 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/enum";
import type { OrderResponse } from "@/types/order";
import { formatRelativeTime } from "@/utils/format-date";

const orderStatusStyles: Record<OrderStatus, string> = {
	PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
	PROCESSING: "bg-blue-500/10 text-blue-700 border-blue-500/20",
	SHIPPED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
	DELIVERED: "bg-green-500/10 text-green-700 border-green-500/20",
	CANCELED: "bg-red-500/10 text-red-700 border-red-500/20",
};

interface SettingsOrdersSectionState {
	orders: OrderResponse[];
	isLoading: boolean;
	isEmptyOrders: boolean;
	isError: boolean;
}

interface SettingsOrdersSectionBaseProps extends SettingsOrdersSectionState {
	sectionTitle: string;
	sectionDescription: string;
	emptyTitle: string;
	emptyDescription: string;
	errorTitle: string;
	showCustomerName?: boolean;
}

export function CustomerSettingsOrdersSection(
	props: SettingsOrdersSectionState,
) {
	return (
		<SettingsOrdersSectionBase
			{...props}
			sectionTitle="Recent Orders"
			sectionDescription="Your latest marketplace purchases."
			emptyTitle="No orders yet"
			emptyDescription="Orders will appear here after checkout."
			errorTitle="Unable to load orders"
		/>
	);
}

export function SellerSettingsOrdersSection(props: SettingsOrdersSectionState) {
	return (
		<SettingsOrdersSectionBase
			{...props}
			sectionTitle="Recent Sales"
			sectionDescription="Recent orders that include your listed products."
			emptyTitle="No sales yet"
			emptyDescription="Sales orders will appear here when customers buy your products."
			errorTitle="Unable to load sales"
			showCustomerName
		/>
	);
}

function SettingsOrdersSectionBase({
	orders,
	isLoading,
	isEmptyOrders,
	isError,
	sectionTitle,
	sectionDescription,
	emptyTitle,
	emptyDescription,
	errorTitle,
	showCustomerName = false,
}: SettingsOrdersSectionBaseProps) {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1">
				<H4>{sectionTitle}</H4>
				<BodySmall className="text-muted-foreground">
					{sectionDescription}
				</BodySmall>
			</div>

			<div className="border-y border-border py-6">
				{isLoading && (
					<div className="flex min-h-32 items-center justify-center">
						<AnimatedLoader
							svgSize={80}
							pingSize="size-24"
							textSize="text-base"
							containerSizeClass="w-fit min-h-fit"
						/>
					</div>
				)}

				{!isLoading && isError && (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<div className="mb-3 rounded-md bg-destructive/10 p-3 text-destructive">
							<AlertCircle className="size-6" />
						</div>
						<BodyLarge className="text-base">{errorTitle}</BodyLarge>
						<BodySmall className="mt-1 max-w-sm text-muted-foreground">
							Refresh the page or try again in a moment.
						</BodySmall>
					</div>
				)}

				{!isLoading && !isError && isEmptyOrders && (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<div className="mb-3 rounded-md bg-muted p-3 text-muted-foreground">
							<Package className="size-6" />
						</div>
						<BodyLarge className="text-base">{emptyTitle}</BodyLarge>
						<BodySmall className="mt-1 max-w-sm text-muted-foreground">
							{emptyDescription}
						</BodySmall>
					</div>
				)}

				{!isLoading && !isError && !isEmptyOrders && (
					<ul className="grid gap-3">
						{orders.slice(0, 4).map((order) => {
							const itemCount = order.items?.length ?? 0;

							return (
								<li
									key={order.id}
									className="flex flex-col gap-3 rounded-md border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="flex min-w-0 gap-3">
										<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
											<ShoppingBag size={16} />
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<BodyLarge className="break-all text-base">
													#{order.trackingNumber}
												</BodyLarge>
												<Badge className={cn(orderStatusStyles[order.status])}>
													{order.status}
												</Badge>
											</div>
											<BodySmall className="mt-1 text-muted-foreground">
												{formatRelativeTime(order.orderDate)}
												{itemCount > 0
													? ` · ${itemCount} ${itemCount === 1 ? "item" : "items"}`
													: ""}
												{showCustomerName && order.customer
													? ` · ${order.customer.firstName} ${order.customer.lastName}`
													: ""}
											</BodySmall>
										</div>
									</div>

									<div className="shrink-0 sm:text-right">
										<BodyLarge className="text-base font-semibold">
											${order.totalAmount.toFixed(2)}
										</BodyLarge>
									</div>
								</li>
							);
						})}

						{orders.length > 4 && (
							<BodySmall className="text-muted-foreground">
								+{orders.length - 4} more{" "}
								{orders.length - 4 === 1 ? "order" : "orders"}
							</BodySmall>
						)}
					</ul>
				)}
			</div>
		</div>
	);
}
