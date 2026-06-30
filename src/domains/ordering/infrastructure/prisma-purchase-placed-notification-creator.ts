import {
	createPurchasePlacedNotifications,
	NotificationEventHandlerError,
} from "@/domains/notifications/application/notification-event-handlers";
import { PrismaNotifications } from "@/domains/notifications/infrastructure/prisma-notifications";
import type {
	PurchasePlacedNotificationCreatorPort,
	PurchasePlacedNotificationInput,
} from "@/domains/ordering/application/place-purchase";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

export class PurchaseNotificationCreationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PurchaseNotificationCreationError";
	}
}

export class PrismaPurchasePlacedNotificationCreator
	implements PurchasePlacedNotificationCreatorPort<PrismaTransactionContext>
{
	async createForPurchasePlaced(
		context: PrismaTransactionContext,
		input: PurchasePlacedNotificationInput,
	) {
		try {
			await createPurchasePlacedNotifications(
				{
					purchase: {
						id: input.purchase.id,
						customerId: input.purchase.customerId,
						purchaseNumber: input.purchase.purchaseNumber,
						totalAmountCents: input.purchase.total.amountMinor,
						currencyCode: input.purchase.total.currencyCode,
					},
					sellerOrders: input.sellerOrders.map((sellerOrder) => ({
						id: sellerOrder.id,
						purchaseId: sellerOrder.purchaseId,
						sellerId: sellerOrder.sellerId,
						listingNames: sellerOrder.items.map((item) => item.listingName),
						subtotalCents: sellerOrder.subtotal.amountMinor,
						currencyCode: sellerOrder.subtotal.currencyCode,
					})),
					domainEvents: input.domainEvents,
				},
				new PrismaNotifications(context),
			);
		} catch (error) {
			if (error instanceof NotificationEventHandlerError) {
				throw new PurchaseNotificationCreationError(error.message);
			}

			throw error;
		}
	}
}
