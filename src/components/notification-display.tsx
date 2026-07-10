import { Bell, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationData } from "@/types/notification";

type NotificationDisplayKind = "seller-order" | "purchase" | "generic";

type NotificationDisplay = {
	readonly kind: NotificationDisplayKind;
	readonly label: string | null;
};

type NotificationTypeIconProps = {
	readonly notification: NotificationData;
	readonly className?: string;
};

type NotificationOrderingBadgeProps = {
	readonly notification: NotificationData;
	readonly className?: string;
	readonly iconClassName?: string;
};

export function NotificationTypeIcon({
	notification,
	className,
}: NotificationTypeIconProps) {
	const display = getNotificationDisplay(notification);
	const Icon = getNotificationIcon(display.kind);

	return <Icon className={cn("text-primary", className)} />;
}

export function NotificationOrderingBadge({
	notification,
	className,
	iconClassName,
}: NotificationOrderingBadgeProps) {
	const display = getNotificationDisplay(notification);

	if (!display.label || display.kind === "generic") {
		return null;
	}

	const Icon = getOrderingIcon(display.kind);

	return (
		<div
			className={cn(
				"inline-flex items-center rounded-md bg-muted text-muted-foreground",
				className,
			)}
		>
			<Icon className={cn("size-3", iconClassName)} />
			<span>{display.label}</span>
		</div>
	);
}

function getNotificationIcon(kind: NotificationDisplayKind) {
	if (kind === "seller-order") {
		return Package;
	}

	if (kind === "purchase") {
		return ShoppingBag;
	}

	return Bell;
}

function getOrderingIcon(kind: Exclude<NotificationDisplayKind, "generic">) {
	return kind === "seller-order" ? Package : ShoppingBag;
}

function getNotificationDisplay(
	notification: NotificationData,
): NotificationDisplay {
	if (notification.sellerOrderId) {
		return {
			kind: "seller-order",
			label: `Seller order #${notification.sellerOrderId.slice(0, 8)}`,
		};
	}

	if (notification.purchaseId) {
		return {
			kind: "purchase",
			label: `Purchase #${notification.purchaseId.slice(0, 8)}`,
		};
	}

	return {
		kind: "generic",
		label: null,
	};
}
