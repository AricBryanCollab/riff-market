import type { Actor } from "@/domains/shared/domain/actor";
import type {
	DomainEvent,
	RecordsDomainEvents,
} from "@/domains/shared/domain/domain-event";
import { createDomainEvent } from "@/domains/shared/domain/domain-event";
import { Money } from "@/domains/shared/domain/money";

export const sellerOrderStatuses = [
	"ON_HOLD_PAYMENT",
	"NEW",
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"CANCELED",
] as const;

export type SellerOrderStatus = (typeof sellerOrderStatuses)[number];

export type SellerOrderItemSnapshot = {
	readonly listingId: string;
	readonly listingName: string;
	readonly brand: string;
	readonly model: string;
	readonly category: string;
	readonly condition: string;
	readonly primaryImageUrl: string;
	readonly sellerId: string;
	readonly sellerDisplayName: string;
	readonly unitPriceCents: number;
	readonly quantity: number;
	readonly subTotalCents: number;
	readonly currencyCode: string;
};

export type SellerOrderCreatedPayload = {
	readonly sellerOrderId: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly subtotalCents: number;
	readonly currencyCode: string;
};

export type SellerOrderCreatedEvent = DomainEvent<
	"SellerOrderCreated",
	SellerOrderCreatedPayload
>;

export type CreateSellerOrderInput = {
	readonly id: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly items: readonly SellerOrderItemSnapshot[];
	readonly eventId?: string;
	readonly occurredAt?: Date;
};

export class SellerOrder implements RecordsDomainEvents {
	readonly id: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly items: readonly SellerOrderItemSnapshot[];
	readonly subtotal: Money;
	readonly status: SellerOrderStatus;
	readonly trackingNumber: string | null;

	private readonly events: DomainEvent[] = [];

	private constructor(input: CreateSellerOrderInput) {
		assertPresent(input.id, "Seller order ID");
		assertPresent(input.purchaseId, "Purchase ID");
		assertPresent(input.sellerId, "Seller ID");
		assertItems(input.sellerId, input.items);
		const items = copyItemSnapshots(input.items);

		this.id = input.id;
		this.purchaseId = input.purchaseId;
		this.sellerId = input.sellerId;
		this.items = items;
		this.subtotal = calculateSubtotal(items);
		this.status = "NEW";
		this.trackingNumber = null;
	}

	static createManualPaymentReady(input: CreateSellerOrderInput): SellerOrder {
		const sellerOrder = new SellerOrder(input);

		sellerOrder.record(
			createDomainEvent({
				eventId: input.eventId,
				occurredAt: input.occurredAt,
				eventName: "SellerOrderCreated",
				aggregateId: sellerOrder.id,
				payload: {
					sellerOrderId: sellerOrder.id,
					purchaseId: sellerOrder.purchaseId,
					sellerId: sellerOrder.sellerId,
					subtotalCents: sellerOrder.subtotal.amountCents,
					currencyCode: sellerOrder.subtotal.currencyCode,
				},
			}),
		);

		return sellerOrder;
	}

	canBeManagedBy(actor: Actor) {
		return (
			actor.role === "ADMIN" ||
			(actor.role === "SELLER" && actor.id === this.sellerId)
		);
	}

	pullDomainEvents() {
		const events = [...this.events];
		this.events.length = 0;

		return events;
	}

	private record(event: DomainEvent) {
		this.events.push(event);
	}
}

function calculateSubtotal(items: readonly SellerOrderItemSnapshot[]) {
	const [firstItem] = items;
	if (!firstItem) {
		throw new Error("Seller order requires at least one item");
	}

	return items.reduce(
		(total, item) =>
			total.add(Money.fromCents(item.subTotalCents, item.currencyCode)),
		Money.zero(firstItem.currencyCode),
	);
}

function copyItemSnapshots(
	items: readonly SellerOrderItemSnapshot[],
): readonly SellerOrderItemSnapshot[] {
	return Object.freeze(items.map((item) => Object.freeze({ ...item })));
}

function assertItems(
	sellerId: string,
	items: readonly SellerOrderItemSnapshot[],
) {
	if (items.length === 0) {
		throw new Error("Seller order requires at least one item");
	}

	for (const item of items) {
		assertPresent(item.listingId, "Listing ID");
		assertPresent(item.listingName, "Listing name");
		assertPresent(item.brand, "Listing brand");
		assertPresent(item.model, "Listing model");
		assertPresent(item.category, "Listing category");
		assertPresent(item.condition, "Listing condition");
		assertPresent(item.primaryImageUrl, "Listing primary image URL");
		assertPresent(item.sellerId, "Seller ID");
		assertPresent(item.sellerDisplayName, "Seller display name");

		if (item.sellerId !== sellerId) {
			throw new Error(
				"Seller order items must belong to the seller order seller",
			);
		}

		if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
			throw new Error(
				"Seller order item quantity must be a positive safe integer",
			);
		}

		Money.fromCents(item.unitPriceCents, item.currencyCode);
		Money.fromCents(item.subTotalCents, item.currencyCode);

		const expectedSubtotal = item.unitPriceCents * item.quantity;
		if (item.subTotalCents !== expectedSubtotal) {
			throw new Error(
				"Seller order item subtotal must equal unit price times quantity",
			);
		}
	}
}

function assertPresent(value: string, label: string) {
	if (value.trim().length === 0) {
		throw new Error(`${label} is required`);
	}
}
