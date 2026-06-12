import { describe, expect, it } from "vitest";

import { Money } from "@/domains/shared/domain/money";
import { SellerOrder, type SellerOrderItemSnapshot } from "./seller-order";

function makeItem(
	overrides: Partial<SellerOrderItemSnapshot> = {},
): SellerOrderItemSnapshot {
	return {
		listingId: "listing-1",
		listingName: "Telecaster",
		brand: "Fender",
		model: "American Standard",
		category: "ELECTRIC",
		condition: "USED",
		primaryImageUrl: "https://cdn.example.com/listing.jpg",
		sellerId: "seller-1",
		sellerDisplayName: "A Seller",
		unitPriceCents: 125_00,
		quantity: 2,
		subTotalCents: 250_00,
		currencyCode: "USD",
		...overrides,
	};
}

function createSellerOrder(
	overrides: Partial<
		Parameters<typeof SellerOrder.createManualPaymentReady>[0]
	> = {},
) {
	return SellerOrder.createManualPaymentReady({
		id: "seller-order-1",
		purchaseId: "purchase-1",
		sellerId: "seller-1",
		items: [makeItem()],
		eventId: "event-1",
		occurredAt: new Date("2026-06-11T00:00:00.000Z"),
		...overrides,
	});
}

describe("SellerOrder", () => {
	it("creates a seller-facing order released for fulfillment under manual payment", () => {
		const sellerOrder = createSellerOrder();

		expect(sellerOrder).toMatchObject({
			id: "seller-order-1",
			purchaseId: "purchase-1",
			sellerId: "seller-1",
			items: [makeItem()],
			subtotal: Money.fromCents(250_00, "USD"),
			status: "NEW",
			trackingNumber: null,
		});
	});

	it("records SellerOrderCreated and clears events after pulling", () => {
		const sellerOrder = createSellerOrder();

		const events = sellerOrder.pullDomainEvents();

		expect(events).toEqual([
			{
				eventId: "event-1",
				eventName: "SellerOrderCreated",
				occurredAt: new Date("2026-06-11T00:00:00.000Z"),
				aggregateId: "seller-order-1",
				payload: {
					sellerOrderId: "seller-order-1",
					purchaseId: "purchase-1",
					sellerId: "seller-1",
					subtotalCents: 250_00,
					currencyCode: "USD",
				},
			},
		]);
		expect(sellerOrder.pullDomainEvents()).toEqual([]);
	});

	it("allows the owning seller and admins to manage it", () => {
		const sellerOrder = createSellerOrder();

		expect(sellerOrder.canBeManagedBy({ id: "seller-1", role: "SELLER" })).toBe(
			true,
		);
		expect(sellerOrder.canBeManagedBy({ id: "admin-1", role: "ADMIN" })).toBe(
			true,
		);
		expect(sellerOrder.canBeManagedBy({ id: "seller-2", role: "SELLER" })).toBe(
			false,
		);
		expect(
			sellerOrder.canBeManagedBy({ id: "customer-1", role: "CUSTOMER" }),
		).toBe(false);
	});

	it("keeps item snapshots immutable after creation", () => {
		const sourceItem = makeItem();
		const sourceItems = [sourceItem];
		const sellerOrder = createSellerOrder({ items: sourceItems });

		(sourceItem as unknown as { listingName: string }).listingName =
			"Mutated name";
		sourceItems.push(makeItem({ listingId: "listing-2" }));

		expect(sellerOrder.items).toEqual([makeItem()]);
		expect(() => {
			(sellerOrder.items as unknown as SellerOrderItemSnapshot[]).push(
				makeItem({ listingId: "listing-3" }),
			);
		}).toThrow(TypeError);
		expect(() => {
			(sellerOrder.items[0] as unknown as { listingName: string }).listingName =
				"Another name";
		}).toThrow(TypeError);
	});

	it("requires at least one item", () => {
		expect(() => createSellerOrder({ items: [] })).toThrow(
			"Seller order requires at least one item",
		);
	});

	it("requires item seller ownership to match the seller order", () => {
		expect(() =>
			createSellerOrder({
				items: [makeItem({ sellerId: "seller-2" })],
			}),
		).toThrow("Seller order items must belong to the seller order seller");
	});

	it("requires item subtotal to equal unit price times quantity", () => {
		expect(() =>
			createSellerOrder({
				items: [makeItem({ subTotalCents: 249_00 })],
			}),
		).toThrow(
			"Seller order item subtotal must equal unit price times quantity",
		);
	});
});
