export interface NotificationData {
	id?: string;
	userId: string;
	purchaseId?: string | null;
	sellerOrderId?: string | null;
	message: string;
	isRead: boolean;
	createdAt?: string;
}

export type CreateNotificationData = Pick<
	NotificationData,
	"userId" | "purchaseId" | "sellerOrderId" | "message" | "isRead"
>;
