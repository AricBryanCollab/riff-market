import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	getUserNotifications,
	readAllNotifications,
	readNotificationById,
} from "@/lib/tanstack-query/notifications.queries";
import { useNotificationStore } from "@/store/notifications";
import { useToastStore } from "@/store/toast";
import { useUserStore } from "@/store/user";

const useNotifications = () => {
	const queryClient = useQueryClient();
	const {
		notifications,
		unreadCount,
		setNotifications,
		markAllAsRead,
		markAsRead: markAsReadInStore,
	} = useNotificationStore();

	const { user } = useUserStore();
	const { showToast } = useToastStore();

	const { data, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: getUserNotifications,
		staleTime: 30000,
		refetchInterval: 60000,
		enabled: user !== null,
	});

	useEffect(() => {
		if (data) {
			setNotifications(data);
		}
	}, [data, setNotifications]);

	const { mutate: markAsReadMutate } = useMutation({
		mutationFn: readNotificationById,
		onMutate: (id) => {
			markAsReadInStore(id);
		},
		onError: (err, _) => {
			console.error("Failed to mark notification as read:", err);

			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const { mutate: markAllAsReadMutate, isPending: isMarkingAllAsRead } =
		useMutation({
			mutationFn: readAllNotifications,
			onMutate: () => {
				markAllAsRead();
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
			},
			onError: () => {
				showToast("Failed to mark all notifications as read", "error");
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
