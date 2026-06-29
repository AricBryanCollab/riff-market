import { Ban, CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BodyLarge, BodySmall, H4 } from "@/components/ui/typography";
import { useOrdersByRole, useUpdateOrderStatus } from "@/hooks/use-get-orders";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";
import type { OrderDisplayStatus, OrderStatus, UserRole } from "@/types/enum";
import type { OrderResponse } from "@/types/order";
import { formatRelativeTime } from "@/utils/format-date";
import { formatOrderStatusLabel } from "@/utils/order-status-label";

const orderStatusStyles: Record<OrderDisplayStatus, string> = {
	PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
	PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
	ON_HOLD_PAYMENT: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
	OPEN: "bg-blue-500/10 text-blue-700 border-blue-500/20",
	NEW: "bg-blue-500/10 text-blue-700 border-blue-500/20",
	PROCESSING: "bg-blue-500/10 text-blue-700 border-blue-500/20",
	PARTIALLY_SHIPPED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
	SHIPPED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
	DELIVERED: "bg-green-500/10 text-green-700 border-green-500/20",
	PARTIALLY_CANCELED: "bg-red-500/10 text-red-700 border-red-500/20",
	CANCELED: "bg-red-500/10 text-red-700 border-red-500/20",
};

interface SettingsOrdersSectionState {
	orders: OrderResponse[];
	isLoading: boolean;
	isEmptyOrders: boolean;
	isError: boolean;
}

type SettingsOrdersSectionStatus = "loading" | "error" | "empty" | "ready";
type SettingsOrdersSectionVariant = "customer" | "seller";

interface SettingsOrdersSectionProps {
	orders: OrderResponse[];
	status: SettingsOrdersSectionStatus;
}

interface SettingsOrdersSectionBaseProps extends SettingsOrdersSectionProps {
	variant: SettingsOrdersSectionVariant;
	sellerStatusControls?: SellerStatusControlsProps;
}

type SellerStatusCommand = Extract<
	OrderStatus,
	"PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELED"
>;

type SellerStatusControlsProps = {
	isUpdatingStatus: boolean;
	trackingNumbers: Record<string, string>;
	onTrackingNumberChange: (orderId: string, trackingNumber: string) => void;
	onStatusCommand: (order: OrderResponse, status: SellerStatusCommand) => void;
};

const settingsOrdersCopy = {
	customer: {
		sectionTitle: "Recent Orders",
		sectionDescription: "Your latest marketplace purchases.",
		emptyTitle: "No orders yet",
		emptyDescription: "Orders will appear here after checkout.",
		errorTitle: "Unable to load orders",
	},
	seller: {
		sectionTitle: "Recent Sales",
		sectionDescription: "Recent orders that include your listings.",
		emptyTitle: "No sales yet",
		emptyDescription:
			"Sales orders will appear here when customers buy your listings.",
		errorTitle: "Unable to load sales",
	},
} satisfies Record<
	SettingsOrdersSectionVariant,
	{
		sectionTitle: string;
		sectionDescription: string;
		emptyTitle: string;
		emptyDescription: string;
		errorTitle: string;
	}
>;

function getSettingsOrdersStatus({
	isLoading,
	isError,
	isEmptyOrders,
}: Omit<SettingsOrdersSectionState, "orders">): SettingsOrdersSectionStatus {
	if (isLoading) {
		return "loading";
	}

	if (isError) {
		return "error";
	}

	if (isEmptyOrders) {
		return "empty";
	}

	return "ready";
}

export function SettingsOrdersSection({ userRole }: { userRole: UserRole }) {
	if (userRole === "CUSTOMER") {
		return <CustomerSettingsOrders />;
	}

	if (userRole === "SELLER") {
		return <SellerSettingsOrders />;
	}

	return null;
}

function CustomerSettingsOrders() {
	const {
		orders,
		isLoading: isLoadingOrders,
		isEmptyOrders,
		isError: isErrorOrders,
	} = useOrdersByRole("CUSTOMER", {
		polling: false,
	});

	return (
		<CustomerSettingsOrdersSection
			orders={orders}
			status={getSettingsOrdersStatus({
				isLoading: isLoadingOrders,
				isEmptyOrders,
				isError: isErrorOrders,
			})}
		/>
	);
}

function SellerSettingsOrders() {
	const [trackingNumbers, setTrackingNumbers] = useState<
		Record<string, string>
	>({});
	const { showToast } = useToastStore();
	const { updateStatus, isUpdatingStatus } = useUpdateOrderStatus("SELLER");
	const {
		orders,
		isLoading: isLoadingOrders,
		isEmptyOrders,
		isError: isErrorOrders,
	} = useOrdersByRole("SELLER", {
		polling: false,
	});

	const onTrackingNumberChange = (orderId: string, trackingNumber: string) => {
		setTrackingNumbers((current) => ({
			...current,
			[orderId]: trackingNumber,
		}));
	};

	const onStatusCommand = (
		order: OrderResponse,
		status: SellerStatusCommand,
	) => {
		const trackingNumber = trackingNumbers[order.id]?.trim();

		if (status === "SHIPPED" && !trackingNumber) {
			showToast("Tracking number is required to ship this order", "error");
			return;
		}

		updateStatus(
			{
				id: order.id,
				status,
				trackingNumber: status === "SHIPPED" ? trackingNumber : undefined,
			},
			{
				onSuccess: () => {
					if (status === "SHIPPED") {
						setTrackingNumbers((current) => {
							const next = { ...current };
							delete next[order.id];
							return next;
						});
					}

					showToast("Order status updated", "success");
				},
				onError: (error) => {
					showToast(
						error instanceof Error
							? error.message
							: "Failed to update order status",
						"error",
					);
				},
			},
		);
	};

	return (
		<SellerSettingsOrdersSection
			orders={orders}
			status={getSettingsOrdersStatus({
				isLoading: isLoadingOrders,
				isEmptyOrders,
				isError: isErrorOrders,
			})}
			sellerStatusControls={{
				isUpdatingStatus,
				trackingNumbers,
				onTrackingNumberChange,
				onStatusCommand,
			}}
		/>
	);
}

function CustomerSettingsOrdersSection(props: SettingsOrdersSectionProps) {
	return <SettingsOrdersListSection {...props} variant="customer" />;
}

function SellerSettingsOrdersSection(
	props: SettingsOrdersSectionProps & {
		sellerStatusControls: SellerStatusControlsProps;
	},
) {
	return <SettingsOrdersListSection {...props} variant="seller" />;
}

function SettingsOrdersListSection({
	orders,
	status,
	variant,
	sellerStatusControls,
}: SettingsOrdersSectionBaseProps) {
	const {
		sectionTitle,
		sectionDescription,
		emptyTitle,
		emptyDescription,
		errorTitle,
	} = settingsOrdersCopy[variant];

	return (
		<section className="border-t border-border pt-6">
			<div className="grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)]">
				<div>
					<H4 className="text-lg tracking-normal">{sectionTitle}</H4>
					<BodySmall className="mt-2 text-muted-foreground leading-6">
						{sectionDescription}
					</BodySmall>
				</div>

				<div>
					{status === "loading" && (
						<BodySmall className="text-muted-foreground leading-6">
							Loading recent activity...
						</BodySmall>
					)}

					{status === "error" && (
						<BodySmall className="text-destructive leading-6">
							{errorTitle}. Refresh the page or try again in a moment.
						</BodySmall>
					)}

					{status === "empty" && (
						<div className="rounded-md border border-border px-4 py-5">
							<BodyLarge className="text-base tracking-normal">
								{emptyTitle}
							</BodyLarge>
							<BodySmall className="mt-2 text-muted-foreground leading-6">
								{emptyDescription}
							</BodySmall>
						</div>
					)}

					{status === "ready" && (
						<ul className="divide-y divide-border border-y border-border">
							{orders.slice(0, 4).map((order) => {
								const itemCount = order.items?.length ?? 0;

								return (
									<li key={order.id} className="flex flex-col gap-3 py-4">
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<BodyLarge className="break-all text-base tracking-normal">
														#{order.trackingNumber}
													</BodyLarge>
													<Badge
														className={cn(orderStatusStyles[order.status])}
													>
														{formatOrderStatusLabel(order.status)}
													</Badge>
												</div>
												<BodySmall className="mt-2 text-muted-foreground leading-6">
													{formatRelativeTime(order.orderDate)}
													{itemCount > 0
														? ` · ${itemCount} ${itemCount === 1 ? "item" : "items"}`
														: ""}
													{variant === "seller" && order.customer
														? ` · ${order.customer.firstName} ${order.customer.lastName}`
														: ""}
												</BodySmall>
											</div>

											<div className="shrink-0 sm:text-right">
												<BodyLarge className="text-base font-semibold tracking-normal">
													${order.totalAmount.toFixed(2)}
												</BodyLarge>
											</div>
										</div>

										{variant === "seller" && sellerStatusControls ? (
											<SellerOrderStatusControls
												order={order}
												{...sellerStatusControls}
											/>
										) : null}
									</li>
								);
							})}

							{orders.length > 4 && (
								<BodySmall className="py-3 text-muted-foreground leading-6">
									+{orders.length - 4} more{" "}
									{orders.length - 4 === 1 ? "order" : "orders"}
								</BodySmall>
							)}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
}

function SellerOrderStatusControls({
	order,
	isUpdatingStatus,
	trackingNumbers,
	onTrackingNumberChange,
	onStatusCommand,
}: SellerStatusControlsProps & { order: OrderResponse }) {
	const commands = getSellerStatusCommands(order.status);

	if (commands.length === 0) {
		return null;
	}

	const trackingNumber = trackingNumbers[order.id] ?? "";

	return (
		<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/25 p-2 sm:flex-row sm:items-center sm:justify-between">
			{commands.includes("SHIPPED") ? (
				<Input
					value={trackingNumber}
					onChange={(event) =>
						onTrackingNumberChange(order.id, event.target.value)
					}
					placeholder="Tracking number"
					aria-label="Tracking number"
					className="h-8 sm:max-w-56"
					disabled={isUpdatingStatus}
				/>
			) : (
				<BodySmall className="text-muted-foreground leading-6">
					Next status
				</BodySmall>
			)}

			<div className="flex flex-wrap gap-2">
				{commands.map((command) => (
					<Button
						key={command}
						type="button"
						size="xs"
						variant={command === "CANCELED" ? "destructive" : "outline"}
						disabled={isUpdatingStatus}
						onClick={() => onStatusCommand(order, command)}
					>
						<SellerStatusCommandIcon command={command} />
						<span>{getSellerStatusCommandLabel(command)}</span>
					</Button>
				))}
			</div>
		</div>
	);
}

function getSellerStatusCommands(
	status: OrderDisplayStatus,
): SellerStatusCommand[] {
	switch (status) {
		case "NEW":
			return ["PROCESSING", "CANCELED"];
		case "PROCESSING":
			return ["SHIPPED", "CANCELED"];
		case "SHIPPED":
			return ["DELIVERED"];
		default:
			return [];
	}
}

function getSellerStatusCommandLabel(command: SellerStatusCommand) {
	switch (command) {
		case "PROCESSING":
			return "Process";
		case "SHIPPED":
			return "Ship";
		case "DELIVERED":
			return "Delivered";
		case "CANCELED":
			return "Cancel";
	}
}

function SellerStatusCommandIcon({
	command,
}: {
	command: SellerStatusCommand;
}) {
	switch (command) {
		case "PROCESSING":
			return <PackageCheck className="size-3" aria-hidden="true" />;
		case "SHIPPED":
			return <Truck className="size-3" aria-hidden="true" />;
		case "DELIVERED":
			return <CheckCircle2 className="size-3" aria-hidden="true" />;
		case "CANCELED":
			return <Ban className="size-3" aria-hidden="true" />;
	}
}
