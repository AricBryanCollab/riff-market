import type { UseMutateFunction } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Bell, Package, ShoppingBag } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { Button } from "@/components/ui/button";
import { BodySmall, H5 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { NotificationData } from "@/types/notification";
import { formatRelativeTime } from "@/utils/format-date";

const notificationListItemVariants = cva(
	"p-3 rounded-lg transition-colors cursor-pointer hover:bg-accent/50",
	{
		variants: {
			isRead: {
				true: "",
				false: "bg-primary/5 border border-primary/20",
			},
		},
		defaultVariants: {
			isRead: true,
		},
	},
);

const notificationMessageVariants = cva("text-sm", {
	variants: {
		isRead: {
			true: "",
			false: "font-medium",
		},
	},
	defaultVariants: {
		isRead: true,
	},
});

interface NotificationListProps {
	notifications: NotificationData[];
	unreadCount: number;
	isLoading: boolean;
	isEmptyNotifications: boolean;
	markAsRead: UseMutateFunction<NotificationData, Error, string, void>;
}

const NotificationList = ({
	notifications,
	isLoading,
	unreadCount,
	isEmptyNotifications,
	markAsRead,
}: NotificationListProps) => {
	const navigate = useNavigate();
	const getNotificationIcon = (notification: NotificationData) => {
		if (notification.orderId) {
			return <Package className="size-5 text-primary" />;
		}
		return <Bell className="size-5 text-primary" />;
	};

	const handleNotificationClick = (notification: NotificationData) => {
		if (!notification.isRead && notification.id) {
			markAsRead(notification?.id);
		} else return null;
	};

	if (isLoading) {
		return (
			<div className="w-80 max-w-sm bg-background">
				<div className="px-4 py-3 border-b border-border">
					<H5 className="font-semibold text-foreground">Notifications</H5>
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
				<H5 className="font-semibold text-foreground">Notifications</H5>
				{!isEmptyNotifications && (
					<BodySmall className="text-muted-foreground mt-0.5">
						{unreadCount} unread{" "}
						{unreadCount === 1 ? "notification" : "notifications"}
					</BodySmall>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{isEmptyNotifications && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-3">
							<Bell className="size-8 text-muted-foreground" />
						</div>
						<BodySmall className="text-muted-foreground">
							You have no latest notifications
						</BodySmall>
						<BodySmall className="text-muted-foreground/70 text-xs mt-1">
							We'll notify you when something arrives
						</BodySmall>
					</div>
				)}

				{!isEmptyNotifications && (
					<ul className="space-y-2">
						{notifications.slice(0, 10).map((notification) => (
							<li
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								className={cn(
									notificationListItemVariants({
										isRead: notification.isRead,
									}),
								)}
							>
								<div className="flex gap-3">
									{!notification.isRead && (
										<div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
									)}

									<div className="shrink-0 mt-0.5">
										{getNotificationIcon(notification)}
									</div>

									<div className="flex-1 min-w-0">
										<p
											className={cn(
												notificationMessageVariants({
													isRead: notification.isRead,
												}),
											)}
										>
											{notification.message}
										</p>

										{notification.orderId && (
											<div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
												<ShoppingBag className="size-3" />
												<span>Order #{notification.orderId.slice(0, 8)}</span>
											</div>
										)}

										<p className="text-xs text-muted-foreground mt-1.5">
											{formatRelativeTime(notification?.createdAt || "None")}
										</p>
									</div>
								</div>
							</li>
						))}

						{notifications.length > 10 && (
							<div className="text-center pt-2 pb-1">
								<BodySmall className="text-muted-foreground/80 text-xs">
									+{notifications.length - 10} more{" "}
									{notifications.length - 10 === 1
										? "notification"
										: "notifications"}
								</BodySmall>
							</div>
						)}
					</ul>
				)}
			</div>

			{!isEmptyNotifications && (
				<div className="px-4 py-3 border-t border-border bg-muted/30">
					<Button
						onClick={() => navigate({ to: "/notifications" })}
						variant="ghost"
						className="w-full text-sm"
					>
						View All Notifications
					</Button>
				</div>
			)}
		</div>
	);
};

export default NotificationList;
