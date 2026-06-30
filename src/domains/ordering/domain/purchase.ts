import type {
	DomainEvent,
	RecordsDomainEvents,
} from "@/domains/shared/domain/domain-event";
import { createDomainEvent } from "@/domains/shared/domain/domain-event";
import type { Money } from "@/domains/shared/domain/money";

export const purchaseStatuses = ["OPEN", "CANCELED", "COMPLETED"] as const;

export type PurchaseStatus = (typeof purchaseStatuses)[number];

export const paymentStatuses = [
	"MANUALLY_CONFIRMED",
	"PENDING_PAYMENT",
	"AUTHORIZED",
	"PAID",
	"FAILED",
	"REFUNDED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export type BuyerSnapshot = {
	readonly buyerName: string;
	readonly buyerEmail: string;
	readonly buyerPhone: string | null;
	readonly shippingAddress: string;
};

export type PurchasePlacedPayload = {
	readonly purchaseId: string;
	readonly customerId: string;
	readonly purchaseNumber: string;
	readonly totalAmountCents: number;
	readonly currencyCode: string;
};

export type PurchasePlacedEvent = DomainEvent<
	"PurchasePlaced",
	PurchasePlacedPayload
>;

export type PlacePurchaseDomainInput = {
	readonly id: string;
	readonly customerId: string;
	readonly purchaseNumber: string;
	readonly total: Money;
	readonly buyerSnapshot: BuyerSnapshot;
	readonly sellerOrderCount: number;
	readonly eventId?: string;
	readonly occurredAt?: Date;
};

export class Purchase implements RecordsDomainEvents {
	readonly id: string;
	readonly customerId: string;
	readonly purchaseNumber: string;
	readonly total: Money;
	readonly paymentStatus: PaymentStatus;
	readonly status: PurchaseStatus;
	readonly buyerSnapshot: BuyerSnapshot;
	readonly sellerOrderCount: number;

	private readonly events: DomainEvent[] = [];

	private constructor(
		input: PlacePurchaseDomainInput,
		paymentStatus: PaymentStatus,
		status: PurchaseStatus,
	) {
		assertPresent(input.id, "Purchase ID");
		assertPresent(input.customerId, "Customer ID");
		assertPresent(input.purchaseNumber, "Purchase number");
		assertPresent(input.buyerSnapshot.buyerName, "Buyer name");
		assertPresent(input.buyerSnapshot.buyerEmail, "Buyer email");
		assertPresent(input.buyerSnapshot.shippingAddress, "Shipping address");
		assertSellerOrderCount(input.sellerOrderCount);
		assertPositiveTotal(input.total);

		this.id = input.id;
		this.customerId = input.customerId;
		this.purchaseNumber = input.purchaseNumber;
		this.total = input.total;
		this.paymentStatus = paymentStatus;
		this.status = status;
		this.buyerSnapshot = input.buyerSnapshot;
		this.sellerOrderCount = input.sellerOrderCount;
	}

	static placeManualPayment(input: PlacePurchaseDomainInput): Purchase {
		const purchase = new Purchase(input, "MANUALLY_CONFIRMED", "OPEN");

		purchase.record(
			createDomainEvent({
				eventId: input.eventId,
				occurredAt: input.occurredAt,
				eventName: "PurchasePlaced",
				aggregateId: purchase.id,
				payload: {
					purchaseId: purchase.id,
					customerId: purchase.customerId,
					purchaseNumber: purchase.purchaseNumber,
					totalAmountCents: purchase.total.amountMinor,
					currencyCode: purchase.total.currencyCode,
				},
			}),
		);

		return purchase;
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

function assertSellerOrderCount(sellerOrderCount: number) {
	if (!Number.isSafeInteger(sellerOrderCount) || sellerOrderCount < 1) {
		throw new Error("Purchase requires at least one seller order");
	}
}

function assertPositiveTotal(total: Money) {
	if (total.amountMinor <= 0) {
		throw new Error("Purchase total must be greater than zero");
	}
}

function assertPresent(value: string, label: string) {
	if (value.trim().length === 0) {
		throw new Error(`${label} is required`);
	}
}
