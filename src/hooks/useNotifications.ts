import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	getUserNotifications,
	readNotificationById,
} from "@/lib/tanstack-query/notifications.queries";
import { useNotificationStore } from "@/store/notifications";

const useNotifications = () => {
	const queryClient = useQueryClient();
	const {
		notifications,
		unreadCount,
		setNotifications,
		markAsRead: markAsReadInStore,
	} = useNotificationStore();

	const { data, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: getUserNotifications,
		staleTime: 30000,
		refetchInterval: 60000,
	});

	useEffect(() => {
		if (data) {
			setNotifications(data);
		}
	}, [data, setNotifications]);

	const markAsReadMutation = useMutation({
		mutationFn: readNotificationById,
		onMutate: (id) => {
			markAsReadInStore(id);
		},
		onError: (err, _) => {
			console.error("Failed to mark notification as read:", err);

			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const isEmptyNotifications = notifications.length === 0;

	return {
		notifications,
		isLoading,
		unreadCount,
		isEmptyNotifications,
		markAsRead: markAsReadMutation.mutate,
	};
};

export default useNotifications;
