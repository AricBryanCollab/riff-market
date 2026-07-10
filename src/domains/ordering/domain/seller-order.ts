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

export const sellerStatusCommands = [
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"CANCELED",
] as const;

export type SellerStatusCommand = (typeof sellerStatusCommands)[number];

const sellerStatusCommandSources: Record<
	SellerStatusCommand,
	readonly SellerOrderStatus[]
> = {
	PROCESSING: ["NEW"],
	SHIPPED: ["PROCESSING"],
	DELIVERED: ["SHIPPED"],
	CANCELED: ["ON_HOLD_PAYMENT", "NEW", "PROCESSING"],
};

export function allowedSellerStatusCommands(
	status: SellerOrderStatus,
): SellerStatusCommand[] {
	return sellerStatusCommands.filter((command) =>
		sellerStatusCommandSources[command].includes(status),
	);
}

export function isSellerOrderStatus(value: string): value is SellerOrderStatus {
	return sellerOrderStatuses.includes(value as SellerOrderStatus);
}

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

export type SellerOrderStatusChangedPayload = {
	readonly sellerOrderId: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly previousStatus: SellerOrderStatus;
	readonly nextStatus: SellerOrderStatus;
	readonly trackingNumber: string | null;
};

export type SellerOrderStatusChangedEvent = DomainEvent<
	"SellerOrderStatusChanged",
	SellerOrderStatusChangedPayload
>;

export type CreateSellerOrderInput = {
	readonly id: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly items: readonly SellerOrderItemSnapshot[];
	readonly eventId?: string;
	readonly occurredAt?: Date;
};

export type ReconstituteSellerOrderInput = CreateSellerOrderInput & {
	readonly status: SellerOrderStatus;
	readonly trackingNumber: string | null;
};

export class SellerOrder implements RecordsDomainEvents {
	readonly id: string;
	readonly purchaseId: string;
	readonly sellerId: string;
	readonly items: readonly SellerOrderItemSnapshot[];
	readonly subtotal: Money;

	private _status: SellerOrderStatus;
	private _trackingNumber: string | null;

	private readonly events: DomainEvent[] = [];

	private constructor(input: ReconstituteSellerOrderInput) {
		assertPresent(input.id, "Seller order ID");
		assertPresent(input.purchaseId, "Purchase ID");
		assertPresent(input.sellerId, "Seller ID");
		assertSellerOrderStatus(input.status);
		assertItems(input.sellerId, input.items);
		const items = copyItemSnapshots(input.items);

		this.id = input.id;
		this.purchaseId = input.purchaseId;
		this.sellerId = input.sellerId;
		this.items = items;
		this.subtotal = calculateSubtotal(items);
		this._status = input.status;
		this._trackingNumber = input.trackingNumber;
	}

	get status() {
		return this._status;
	}

	get trackingNumber() {
		return this._trackingNumber;
	}

	static createManualPaymentReady(input: CreateSellerOrderInput): SellerOrder {
		const sellerOrder = new SellerOrder({
			...input,
			status: "NEW",
			trackingNumber: null,
		});

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
					subtotalCents: sellerOrder.subtotal.amountMinor,
					currencyCode: sellerOrder.subtotal.currencyCode,
				},
			}),
		);

		return sellerOrder;
	}

	static reconstitute(input: ReconstituteSellerOrderInput): SellerOrder {
		return new SellerOrder(input);
	}

	canBeManagedBy(actor: Actor) {
		return (
			actor.role === "ADMIN" ||
			(actor.role === "SELLER" && actor.id === this.sellerId)
		);
	}

	process() {
		this.transitionTo("PROCESSING", sellerStatusCommandSources.PROCESSING);
	}

	ship(trackingNumber: string) {
		this.transitionTo(
			"SHIPPED",
			sellerStatusCommandSources.SHIPPED,
			normalizeTrackingNumber(trackingNumber),
		);
	}

	deliver() {
		this.transitionTo("DELIVERED", sellerStatusCommandSources.DELIVERED);
	}

	cancel(_actor: Actor) {
		this.transitionTo("CANCELED", sellerStatusCommandSources.CANCELED);
	}

	pullDomainEvents() {
		const events = [...this.events];
		this.events.length = 0;

		return events;
	}

	private record(event: DomainEvent) {
		this.events.push(event);
	}

	private transitionTo(
		nextStatus: SellerOrderStatus,
		allowedCurrentStatuses: readonly SellerOrderStatus[],
		trackingNumber = this.trackingNumber,
	) {
		if (this.status === nextStatus) {
			return;
		}

		if (!allowedCurrentStatuses.includes(this.status)) {
			throw new Error(
				`Cannot change seller order status from ${this.status} to ${nextStatus}`,
			);
		}

		const previousStatus = this.status;
		this._status = nextStatus;
		this._trackingNumber = trackingNumber;
		this.record(
			createDomainEvent({
				eventName: "SellerOrderStatusChanged",
				aggregateId: this.id,
				payload: {
					sellerOrderId: this.id,
					purchaseId: this.purchaseId,
					sellerId: this.sellerId,
					previousStatus,
					nextStatus,
					trackingNumber: this.trackingNumber,
				},
			}),
		);
	}
}

function calculateSubtotal(items: readonly SellerOrderItemSnapshot[]) {
	const [firstItem] = items;
	if (!firstItem) {
		throw new Error("Seller order requires at least one item");
	}

	return items.reduce(
		(total, item) =>
			total.add(Money.fromMinor(item.subTotalCents, item.currencyCode)),
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

		Money.fromMinor(item.unitPriceCents, item.currencyCode);
		Money.fromMinor(item.subTotalCents, item.currencyCode);

		const expectedSubtotal = item.unitPriceCents * item.quantity;
		if (item.subTotalCents !== expectedSubtotal) {
			throw new Error(
				"Seller order item subtotal must equal unit price times quantity",
			);
		}
	}
}

function assertSellerOrderStatus(status: SellerOrderStatus) {
	if (!sellerOrderStatuses.includes(status)) {
		throw new Error(`Invalid seller order status: ${status}`);
	}
}

function assertPresent(value: string, label: string) {
	if (value.trim().length === 0) {
		throw new Error(`${label} is required`);
	}
}

function normalizeTrackingNumber(trackingNumber: string) {
	const normalized = trackingNumber.trim();
	assertPresent(normalized, "Tracking number");

	return normalized;
}
