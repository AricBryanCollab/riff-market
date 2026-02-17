import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	getNotificationCount,
	getUserNotifications,
	readAllNotifications,
	readNotificationById,
} from "@/lib/tanstack-query/notifications-queries";
import { useToastStore } from "@/store/toast";
import type { NotificationData } from "@/types/notification";

export const notificationsQueryOpt = queryOptions({
	queryKey: ["notifications"],
	queryFn: getUserNotifications,
	staleTime: 30000,
});

export const notificationCountQueryOpt = queryOptions({
	queryKey: ["notifications", "count"],
	queryFn: getNotificationCount,
	staleTime: 30000,
});

interface UseNotificationsOptions {
	enabled?: boolean;
	polling?: boolean;
}

const useNotifications = (options: UseNotificationsOptions = {}) => {
	const queryClient = useQueryClient();

	const { showToast } = useToastStore();
	const enabled = options.enabled ?? true;
	const polling = options.polling ?? true;
	const isQueryEnabled = enabled;
	const notificationsKey = ["notifications"] as const;
	const notificationCountKey = ["notifications", "count"] as const;

	const { data, isLoading } = useQuery({
		...notificationsQueryOpt,
		refetchInterval: isQueryEnabled && polling ? 60000 : false,
		enabled: isQueryEnabled,
	});

	const notifications = data ?? [];
	const unreadCount = notifications.filter(
		(notification) => !notification.isRead,
	).length;

	const { mutate: markAsReadMutate } = useMutation({
		mutationFn: readNotificationById,
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: notificationsKey });
			await queryClient.cancelQueries({ queryKey: notificationCountKey });

			const previousNotifications =
				queryClient.getQueryData<NotificationData[]>(notificationsKey);
			const previousCount = queryClient.getQueryData<{ count: number }>(
				notificationCountKey,
			);
			const targetNotification = previousNotifications?.find(
				(notification) => notification.id === id,
			);

			queryClient.setQueryData<NotificationData[]>(
				notificationsKey,
				(currentNotifications) =>
					currentNotifications?.map((notification) =>
						notification.id === id
							? { ...notification, isRead: true }
							: notification,
					) ?? currentNotifications,
			);

			queryClient.setQueryData<{ count: number }>(
				notificationCountKey,
				(current) => {
					if (!current) {
						return current;
					}

					if (!targetNotification || targetNotification.isRead) {
						return current;
					}

					return { count: Math.max(0, current.count - 1) };
				},
			);

			return { previousNotifications, previousCount };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationCountKey });
		},
		onError: (err, _, context) => {
			console.error("Failed to mark notification as read:", err);

			if (context?.previousNotifications) {
				queryClient.setQueryData(
					notificationsKey,
					context.previousNotifications,
				);
			}

			if (context?.previousCount) {
				queryClient.setQueryData(notificationCountKey, context.previousCount);
			}

			queryClient.invalidateQueries({ queryKey: notificationsKey });
			queryClient.invalidateQueries({ queryKey: notificationCountKey });
		},
	});

	const { mutate: markAllAsReadMutate, isPending: isMarkingAllAsRead } =
		useMutation({
			mutationFn: readAllNotifications,
			onMutate: async () => {
				await queryClient.cancelQueries({ queryKey: notificationsKey });
				await queryClient.cancelQueries({ queryKey: notificationCountKey });

				const previousNotifications =
					queryClient.getQueryData<NotificationData[]>(notificationsKey);
				const previousCount = queryClient.getQueryData<{ count: number }>(
					notificationCountKey,
				);

				queryClient.setQueryData<NotificationData[]>(
					notificationsKey,
					(currentNotifications) =>
						currentNotifications?.map((notification) => ({
							...notification,
							isRead: true,
						})) ?? currentNotifications,
				);

				queryClient.setQueryData(notificationCountKey, { count: 0 });

				return { previousNotifications, previousCount };
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: notificationsKey });
				queryClient.invalidateQueries({ queryKey: notificationCountKey });
			},
			onError: (_, __, context) => {
				if (context?.previousNotifications) {
					queryClient.setQueryData(
						notificationsKey,
						context.previousNotifications,
					);
				}

				if (context?.previousCount) {
					queryClient.setQueryData(notificationCountKey, context.previousCount);
				}

				showToast("Failed to mark all notifications as read", "error");
				queryClient.invalidateQueries({ queryKey: notificationsKey });
				queryClient.invalidateQueries({ queryKey: notificationCountKey });
			},
		});

	const handleMarkAllAsRead = () => {
		markAllAsReadMutate();
	};

	const isEmptyNotifications = notifications.length === 0;

	return {
		notifications,
		isLoading,
		unreadCount,
		isEmptyNotifications,
		isMarkingAllAsRead,
		markAsReadMutate,
		handleMarkAllAsRead,
	};
};

export default useNotifications;
