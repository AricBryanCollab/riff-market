export type NotificationView = {
	readonly id: string;
	readonly userId: string;
	readonly purchaseId: string | null;
	readonly sellerOrderId: string | null;
	readonly message: string;
	readonly isRead: boolean;
	readonly createdAt: string;
};

export type CreateNotificationCommand = {
	readonly userId: string;
	readonly purchaseId?: string | null;
	readonly sellerOrderId?: string | null;
	readonly message: string;
	readonly isRead?: boolean;
};
