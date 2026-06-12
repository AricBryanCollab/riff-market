import type {
	PurchasePlacedNotificationCreatorPort,
	PurchasePlacedNotificationInput,
} from "@/domains/ordering/application/place-purchase";
import type { PurchasePlacedEvent } from "@/domains/ordering/domain/purchase";
import type { SellerOrderCreatedEvent } from "@/domains/ordering/domain/seller-order";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
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
		const { sellerOrders } = input;
		const purchaseEvent = getPurchasePlacedEvent(input);
		const sellerOrderEvents = getSellerOrderCreatedEvents(input);

		await context.notification.create({
			data: {
				userId: purchaseEvent.payload.customerId,
				purchaseId: purchaseEvent.payload.purchaseId,
				message: `Your purchase #${purchaseEvent.payload.purchaseNumber} has been placed successfully! Total: ${formatMoney(purchaseEvent.payload.totalAmountCents, purchaseEvent.payload.currencyCode)}`,
				isRead: false,
			},
		});

		for (const sellerOrder of sellerOrders) {
			const sellerOrderEvent = sellerOrderEvents.get(sellerOrder.id);
			if (!sellerOrderEvent) {
				throw new PurchaseNotificationCreationError(
					`Missing SellerOrderCreated event for seller order ${sellerOrder.id}`,
				);
			}
			const productList = sellerOrder.items
				.map((item) => item.listingName)
				.join(", ");

			await context.notification.create({
				data: {
					userId: sellerOrderEvent.payload.sellerId,
					purchaseId: sellerOrderEvent.payload.purchaseId,
					sellerOrderId: sellerOrderEvent.payload.sellerOrderId,
					message: `New seller order for purchase #${purchaseEvent.payload.purchaseNumber}: ${productList}. Amount: ${formatMoney(sellerOrderEvent.payload.subtotalCents, sellerOrderEvent.payload.currencyCode)}`,
					isRead: false,
				},
			});
		}
	}
}

function getPurchasePlacedEvent({
	purchase,
	domainEvents,
}: PurchasePlacedNotificationInput) {
	const purchaseEvents = domainEvents.filter(isPurchasePlacedEvent);

	if (purchaseEvents.length !== 1) {
		throw new PurchaseNotificationCreationError(
			"Purchase notification creation requires exactly one PurchasePlaced event",
		);
	}

	const [purchaseEvent] = purchaseEvents;
	assertPurchaseEventMatchesAggregate(purchaseEvent, purchase);

	return purchaseEvent;
}

function getSellerOrderCreatedEvents({
	purchase,
	sellerOrders,
	domainEvents,
}: PurchasePlacedNotificationInput) {
	const sellerOrderEvents = domainEvents.filter(isSellerOrderCreatedEvent);

	if (sellerOrderEvents.length !== sellerOrders.length) {
		throw new PurchaseNotificationCreationError(
			"Purchase notification creation requires one SellerOrderCreated event per seller order",
		);
	}

	const sellerOrdersById = new Map(
		sellerOrders.map((sellerOrder) => [sellerOrder.id, sellerOrder]),
	);
	const eventsBySellerOrderId = new Map<string, SellerOrderCreatedEvent>();

	for (const event of sellerOrderEvents) {
		const sellerOrder = sellerOrdersById.get(event.payload.sellerOrderId);
		if (!sellerOrder) {
			throw new PurchaseNotificationCreationError(
				`SellerOrderCreated event references unknown seller order ${event.payload.sellerOrderId}`,
			);
		}

		if (eventsBySellerOrderId.has(event.payload.sellerOrderId)) {
			throw new PurchaseNotificationCreationError(
				`Duplicate SellerOrderCreated event for seller order ${event.payload.sellerOrderId}`,
			);
		}

		assertSellerOrderEventMatchesAggregate(event, purchase.id, sellerOrder);
		eventsBySellerOrderId.set(event.payload.sellerOrderId, event);
	}

	for (const sellerOrder of sellerOrders) {
		if (!eventsBySellerOrderId.has(sellerOrder.id)) {
			throw new PurchaseNotificationCreationError(
				`Missing SellerOrderCreated event for seller order ${sellerOrder.id}`,
			);
		}
	}

	return eventsBySellerOrderId;
}

function assertPurchaseEventMatchesAggregate(
	event: PurchasePlacedEvent,
	purchase: PurchasePlacedNotificationInput["purchase"],
) {
	if (
		event.aggregateId !== purchase.id ||
		event.payload.purchaseId !== purchase.id ||
		event.payload.customerId !== purchase.customerId ||
		event.payload.purchaseNumber !== purchase.purchaseNumber ||
		event.payload.totalAmountCents !== purchase.total.amountCents ||
		event.payload.currencyCode !== purchase.total.currencyCode
	) {
		throw new PurchaseNotificationCreationError(
			`PurchasePlaced event is inconsistent with purchase ${purchase.id}`,
		);
	}
}

function assertSellerOrderEventMatchesAggregate(
	event: SellerOrderCreatedEvent,
	purchaseId: string,
	sellerOrder: PurchasePlacedNotificationInput["sellerOrders"][number],
) {
	if (
		event.aggregateId !== sellerOrder.id ||
		event.payload.sellerOrderId !== sellerOrder.id ||
		event.payload.purchaseId !== purchaseId ||
		event.payload.purchaseId !== sellerOrder.purchaseId ||
		event.payload.sellerId !== sellerOrder.sellerId ||
		event.payload.subtotalCents !== sellerOrder.subtotal.amountCents ||
		event.payload.currencyCode !== sellerOrder.subtotal.currencyCode
	) {
		throw new PurchaseNotificationCreationError(
			`SellerOrderCreated event is inconsistent with seller order ${sellerOrder.id}`,
		);
	}
}

function isPurchasePlacedEvent(
	event: DomainEvent,
): event is PurchasePlacedEvent {
	return event.eventName === "PurchasePlaced";
}

function isSellerOrderCreatedEvent(
	event: DomainEvent,
): event is SellerOrderCreatedEvent {
	return event.eventName === "SellerOrderCreated";
}

function formatMoney(amountCents: number, currencyCode: string) {
	return `${currencyCode} ${(amountCents / 100).toFixed(2)}`;
}
