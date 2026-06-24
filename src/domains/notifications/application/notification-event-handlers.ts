import type { ListingLifecycleEvent } from "@/domains/listings/domain/listing";
import type { PurchasePlacedEvent } from "@/domains/ordering/domain/purchase";
import type { SellerOrderCreatedEvent } from "@/domains/ordering/domain/seller-order";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
import type { NotificationCreatePort } from "./notification-use-cases";
import { CreateNotification } from "./notification-use-cases";

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

export class CreatePurchasePlacedNotifications {
	private readonly createNotification: CreateNotification;

	constructor(notifications: NotificationCreatePort) {
		this.createNotification = new CreateNotification(notifications);
	}

	async execute(input: PurchasePlacedNotificationEventInput): Promise<void> {
		const purchaseEvent = getPurchasePlacedEvent(input);
		const sellerOrderEvents = getSellerOrderCreatedEvents(input);

		await createOrThrow(this.createNotification, {
			userId: purchaseEvent.payload.customerId,
			purchaseId: purchaseEvent.payload.purchaseId,
			sellerOrderId: null,
			message: `Your purchase #${purchaseEvent.payload.purchaseNumber} has been placed successfully! Total: ${formatMoney(purchaseEvent.payload.totalAmountCents, purchaseEvent.payload.currencyCode)}`,
		});

		for (const sellerOrder of input.sellerOrders) {
			const sellerOrderEvent = sellerOrderEvents.get(sellerOrder.id);
			if (!sellerOrderEvent) {
				throw new NotificationEventHandlerError(
					`Missing SellerOrderCreated event for seller order ${sellerOrder.id}`,
				);
			}

			await createOrThrow(this.createNotification, {
				userId: sellerOrderEvent.payload.sellerId,
				purchaseId: sellerOrderEvent.payload.purchaseId,
				sellerOrderId: sellerOrderEvent.payload.sellerOrderId,
				message: `New seller order for purchase #${purchaseEvent.payload.purchaseNumber}: ${sellerOrder.listingNames.join(", ")}. Amount: ${formatMoney(sellerOrderEvent.payload.subtotalCents, sellerOrderEvent.payload.currencyCode)}`,
			});
		}
	}
}

export type ListingModerationNotificationEventInput = {
	readonly event: Extract<
		ListingLifecycleEvent,
		{ readonly eventName: "ListingApproved" | "ListingDeclined" }
	>;
	readonly listingName: string;
};

export class CreateListingModerationNotification {
	private readonly createNotification: CreateNotification;

	constructor(notifications: NotificationCreatePort) {
		this.createNotification = new CreateNotification(notifications);
	}

	async execute(input: ListingModerationNotificationEventInput): Promise<void> {
		const sellerId = input.event.payload.sellerId;
		const message =
			input.event.eventName === "ListingApproved"
				? `Great News! Your product ${input.listingName} has been approved and live at the RiffMarket shop`
				: `Your product ${input.listingName} has been declined by the admin`;

		await createOrThrow(this.createNotification, {
			userId: sellerId,
			purchaseId: null,
			sellerOrderId: null,
			message,
		});
	}
}

async function createOrThrow(
	createNotification: CreateNotification,
	command: Parameters<CreateNotification["execute"]>[0],
) {
	const result = await createNotification.execute(command);

	if (!result.ok) {
		throw new NotificationEventHandlerError(result.error.message);
	}
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
	const eventsBySellerOrderId = new Map<string, SellerOrderCreatedEvent>();

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
	event: PurchasePlacedEvent,
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
	event: SellerOrderCreatedEvent,
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
