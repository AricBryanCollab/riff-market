import { describe, expect, it } from "vitest";

import { Money } from "@/domains/shared/domain/money";
import { Purchase } from "./purchase";

function placePurchase(
	overrides: Partial<Parameters<typeof Purchase.placeManualPayment>[0]> = {},
) {
	return Purchase.placeManualPayment({
		id: "purchase-1",
		customerId: "customer-1",
		purchaseNumber: "RM-1001",
		total: Money.fromCents(250_00, "USD"),
		buyerSnapshot: {
			buyerName: "Pat Buyer",
			buyerEmail: "pat@example.com",
			buyerPhone: null,
			shippingAddress: "123 Market St",
		},
		sellerOrderCount: 2,
		eventId: "event-1",
		occurredAt: new Date("2026-06-11T00:00:00.000Z"),
		...overrides,
	});
}

describe("Purchase", () => {
	it("places a manual-payment purchase with buyer-facing state", () => {
		const purchase = placePurchase();

		expect(purchase).toMatchObject({
			id: "purchase-1",
			customerId: "customer-1",
			purchaseNumber: "RM-1001",
			total: Money.fromCents(250_00, "USD"),
			paymentStatus: "MANUALLY_CONFIRMED",
			status: "OPEN",
			buyerSnapshot: {
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
			sellerOrderCount: 2,
		});
	});

	it("records PurchasePlaced and clears events after pulling", () => {
		const purchase = placePurchase();

		const events = purchase.pullDomainEvents();

		expect(events).toEqual([
			{
				eventId: "event-1",
				eventName: "PurchasePlaced",
				occurredAt: new Date("2026-06-11T00:00:00.000Z"),
				aggregateId: "purchase-1",
				payload: {
					purchaseId: "purchase-1",
					customerId: "customer-1",
					purchaseNumber: "RM-1001",
					totalAmountCents: 250_00,
					currencyCode: "USD",
				},
			},
		]);
		expect(purchase.pullDomainEvents()).toEqual([]);
	});

	it("requires at least one seller order", () => {
		expect(() => placePurchase({ sellerOrderCount: 0 })).toThrow(
			"Purchase requires at least one seller order",
		);
	});

	it("requires a positive total", () => {
		expect(() => placePurchase({ total: Money.zero("USD") })).toThrow(
			"Purchase total must be greater than zero",
		);
	});
});
