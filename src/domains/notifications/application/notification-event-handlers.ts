import type {
	ListingModerationNotificationEvent,
	PurchasePlacedNotificationEvent,
	SellerOrderCreatedNotificationEvent,
} from "@/domains/notifications/dto/notification-event";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
import { formatMoneyAmountMinor } from "@/utils/format-money";
import type { NotificationCreatePort } from "./notification-ports";

export class NotificationEventHandlerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotificationEventHandlerError";
	}
}

export type PurchaseNotificationSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly purchaseNumber: string;
	readonly totalAmountCents: number;
	readonly currencyCode: string;
};

export type SellerOrderNotificationSnapshot = {
	readonly id: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly listingNames: readonly string[];
	readonly subtotalCents: number;
	readonly currencyCode: string;
};

export type PurchasePlacedNotificationEventInput = {
	readonly purchase: PurchaseNotificationSnapshot;
	readonly sellerOrders: readonly SellerOrderNotificationSnapshot[];
	readonly domainEvents: readonly DomainEvent[];
};

export async function createPurchasePlacedNotifications(
	input: PurchasePlacedNotificationEventInput,
	notifications: NotificationCreatePort,
): Promise<void> {
	const purchaseEvent = getPurchasePlacedEvent(input);
	const sellerOrderEvents = getSellerOrderCreatedEvents(input);

	await notifications.create({
		userId: purchaseEvent.payload.customerId,
		purchaseId: purchaseEvent.payload.purchaseId,
		sellerOrderId: null,
		message: `Your purchase #${purchaseEvent.payload.purchaseNumber} has been placed successfully! Total: ${formatMoneyAmountMinor(purchaseEvent.payload.totalAmountCents, purchaseEvent.payload.currencyCode)}`,
		isRead: false,
	});

	for (const sellerOrder of input.sellerOrders) {
		const sellerOrderEvent = sellerOrderEvents.get(sellerOrder.id);
		if (!sellerOrderEvent) {
			throw new NotificationEventHandlerError(
				`Missing SellerOrderCreated event for seller order ${sellerOrder.id}`,
			);
		}

		await notifications.create({
			userId: sellerOrderEvent.payload.sellerId,
			purchaseId: sellerOrderEvent.payload.purchaseId,
			sellerOrderId: sellerOrderEvent.payload.sellerOrderId,
			message: `New seller order for purchase #${purchaseEvent.payload.purchaseNumber}: ${sellerOrder.listingNames.join(", ")}. Amount: ${formatMoneyAmountMinor(sellerOrderEvent.payload.subtotalCents, sellerOrderEvent.payload.currencyCode)}`,
			isRead: false,
		});
	}
}

export type ListingModerationNotificationEventInput = {
	readonly event: ListingModerationNotificationEvent;
	readonly listingName: string;
};

export async function createListingModerationNotification(
	input: ListingModerationNotificationEventInput,
	notifications: NotificationCreatePort,
): Promise<void> {
	const sellerId = input.event.payload.sellerId;
	const message =
		input.event.eventName === "ListingApproved"
			? `Great News! Your listing ${input.listingName} has been approved and live at the RiffMarket shop`
			: `Your listing ${input.listingName} has been declined by the admin`;

	await notifications.create({
		userId: sellerId,
		purchaseId: null,
		sellerOrderId: null,
		message,
		isRead: false,
	});
}

function getPurchasePlacedEvent({
	purchase,
	domainEvents,
}: PurchasePlacedNotificationEventInput) {
	const purchaseEvents = domainEvents.filter(isPurchasePlacedEvent);

	if (purchaseEvents.length !== 1) {
		throw new NotificationEventHandlerError(
			"Purchase notification creation requires exactly one PurchasePlaced event",
		);
	}

	const [purchaseEvent] = purchaseEvents;
	assertPurchaseEventMatchesSnapshot(purchaseEvent, purchase);

	return purchaseEvent;
}

function getSellerOrderCreatedEvents({
	purchase,
	sellerOrders,
	domainEvents,
}: PurchasePlacedNotificationEventInput) {
	const sellerOrderEvents = domainEvents.filter(isSellerOrderCreatedEvent);

	if (sellerOrderEvents.length !== sellerOrders.length) {
		throw new NotificationEventHandlerError(
			"Purchase notification creation requires one SellerOrderCreated event per seller order",
		);
	}

	const sellerOrdersById = new Map(
		sellerOrders.map((sellerOrder) => [sellerOrder.id, sellerOrder]),
	);
	const eventsBySellerOrderId = new Map<
		string,
		SellerOrderCreatedNotificationEvent
	>();

	for (const event of sellerOrderEvents) {
		const sellerOrder = sellerOrdersById.get(event.payload.sellerOrderId);
		if (!sellerOrder) {
			throw new NotificationEventHandlerError(
				`SellerOrderCreated event references unknown seller order ${event.payload.sellerOrderId}`,
			);
		}

		if (eventsBySellerOrderId.has(event.payload.sellerOrderId)) {
			throw new NotificationEventHandlerError(
				`Duplicate SellerOrderCreated event for seller order ${event.payload.sellerOrderId}`,
			);
		}

		assertSellerOrderEventMatchesSnapshot(event, purchase.id, sellerOrder);
		eventsBySellerOrderId.set(event.payload.sellerOrderId, event);
	}

	for (const sellerOrder of sellerOrders) {
		if (!eventsBySellerOrderId.has(sellerOrder.id)) {
			throw new NotificationEventHandlerError(
				`Missing SellerOrderCreated event for seller order ${sellerOrder.id}`,
			);
		}
	}

	return eventsBySellerOrderId;
}

function assertPurchaseEventMatchesSnapshot(
	event: PurchasePlacedNotificationEvent,
	purchase: PurchaseNotificationSnapshot,
) {
	if (
		event.aggregateId !== purchase.id ||
		event.payload.purchaseId !== purchase.id ||
		event.payload.customerId !== purchase.customerId ||
		event.payload.purchaseNumber !== purchase.purchaseNumber ||
		event.payload.totalAmountCents !== purchase.totalAmountCents ||
		event.payload.currencyCode !== purchase.currencyCode
	) {
		throw new NotificationEventHandlerError(
			`PurchasePlaced event is inconsistent with purchase ${purchase.id}`,
		);
	}
}

function assertSellerOrderEventMatchesSnapshot(
	event: SellerOrderCreatedNotificationEvent,
	purchaseId: string,
	sellerOrder: SellerOrderNotificationSnapshot,
) {
	if (
		event.aggregateId !== sellerOrder.id ||
		event.payload.sellerOrderId !== sellerOrder.id ||
		event.payload.purchaseId !== purchaseId ||
		event.payload.purchaseId !== sellerOrder.purchaseId ||
		event.payload.sellerId !== sellerOrder.sellerId ||
		event.payload.subtotalCents !== sellerOrder.subtotalCents ||
		event.payload.currencyCode !== sellerOrder.currencyCode
	) {
		throw new NotificationEventHandlerError(
			`SellerOrderCreated event is inconsistent with seller order ${sellerOrder.id}`,
		);
	}
}

function isPurchasePlacedEvent(
	event: DomainEvent,
): event is PurchasePlacedNotificationEvent {
	return event.eventName === "PurchasePlaced";
}

function isSellerOrderCreatedEvent(
	event: DomainEvent,
): event is SellerOrderCreatedNotificationEvent {
	return event.eventName === "SellerOrderCreated";
}
