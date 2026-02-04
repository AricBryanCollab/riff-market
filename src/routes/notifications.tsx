import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import { Bell, Package, ShoppingBag } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { Button } from "@/components/ui/button";
import { BodySmall, H3, H5 } from "@/components/ui/typography";
import useNotifications from "@/hooks/useNotifications";
import { useUserStore } from "@/store/user";
import type { NotificationData } from "@/types/notification";
import { formatRelativeTime } from "@/utils/formatDate";

export const Route = createFileRoute("/notifications")({
	beforeLoad: () => {
		const user = useUserStore.getState().user;
		if (!user) {
			throw redirect({ to: "/" });
		}
	},
	component: NotificationsPage,
});

function NotificationsPage() {
	const {
		notifications,
		isLoading,
		unreadCount,
		markAsReadMutate,
		handleMarkAllAsRead,
		isMarkingAllAsRead,
	} = useNotifications();

	const isEmptyNotifications = !notifications || notifications.length === 0;

	const getNotificationIcon = (notification: NotificationData) => {
		if (notification.orderId) {
			return <Package className="size-6 text-primary" />;
		}
		return <Bell className="size-6 text-primary" />;
	};

	const handleNotificationClick = (notification: NotificationData) => {
		if (!notification.isRead && notification.id) {
			markAsReadMutate(notification.id);
		}
	};

	if (isLoading) {
		return (
			<div className="container max-w-4xl mx-auto px-4 py-8">
				<div className="bg-background rounded-lg border border-border">
					<div className="px-6 py-4 border-b border-border">
						<H3 className="font-semibold text-foreground">Notifications</H3>
					</div>
					<div className="px-6 py-8">
						<AnimatedLoader
							svgSize={100}
							pingSize="size-32"
							textSize="text-lg"
							containerSizeClass="w-fit min-h-fit mx-auto py-12"
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-4xl mx-auto px-4 py-8">
			<div className="bg-background rounded-lg border border-border">
				<div className="px-6 py-4 border-b border-border">
					<div className="flex items-center justify-between">
						<div>
							<H3 className="font-semibold text-foreground">Notifications</H3>
							{!isEmptyNotifications && (
								<BodySmall className="text-muted-foreground mt-1">
									{unreadCount} unread{" "}
									{unreadCount === 1 ? "notification" : "notifications"}
								</BodySmall>
							)}
						</div>
						{!isEmptyNotifications && unreadCount > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleMarkAllAsRead}
								className="text-sm"
							>
								{isMarkingAllAsRead ? "Marking..." : "Mark all as read"}
							</Button>
						)}
					</div>
				</div>

				<div className="px-6 py-4">
					{isEmptyNotifications ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="rounded-full bg-muted p-6 mb-4">
								<Bell className="size-12 text-muted-foreground" />
							</div>
							<H5 className="text-foreground mb-2">No notifications yet</H5>
							<BodySmall className="text-muted-foreground/70 max-w-sm">
								We'll notify you when something arrives. Check back later for
								updates on your orders and account.
							</BodySmall>
						</div>
					) : (
						<div className="space-y-3">
							{notifications.map((notification) => (
								<div
									key={notification.id}
									onClick={() => handleNotificationClick(notification)}
									className={`
                    p-4 rounded-lg transition-all cursor-pointer border
                    hover:bg-accent/50 hover:border-accent
                    ${
											!notification.isRead
												? "bg-primary/5 border-primary/20"
												: "border-border bg-background"
										}
                  `}
								>
									<div className="flex gap-4">
										{!notification.isRead && (
											<div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
										)}

										<div className="shrink-0 mt-0.5">
											{getNotificationIcon(notification)}
										</div>

										<div className="flex-1 min-w-0">
											<p
												className={`text-base ${
													!notification.isRead
														? "font-medium text-foreground"
														: "text-foreground/90"
												}`}
											>
												{notification.message}
											</p>

											{notification.orderId && (
												<div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-muted text-sm text-muted-foreground">
													<ShoppingBag className="size-3.5" />
													<span>Order #{notification.orderId.slice(0, 8)}</span>
												</div>
											)}

											<ClientOnly>
												<p className="text-sm text-muted-foreground mt-2">
													{formatRelativeTime(
														notification?.createdAt || "None",
													)}
												</p>
											</ClientOnly>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
