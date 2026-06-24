import { describe, expect, it, vi } from "vitest";

import type { PurchasePlacedNotificationInput } from "@/domains/ordering/application/place-purchase";
import { Purchase } from "@/domains/ordering/domain/purchase";
import {
	SellerOrder,
	type SellerOrderItemSnapshot,
} from "@/domains/ordering/domain/seller-order";
import { Money } from "@/domains/shared/domain/money";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";
import {
	PrismaPurchasePlacedNotificationCreator,
	PurchaseNotificationCreationError,
} from "./prisma-purchase-placed-notification-creator";

type CreatedNotification = {
	readonly userId: string;
	readonly purchaseId?: string;
	readonly sellerOrderId?: string;
	readonly message: string;
	readonly isRead: boolean;
};

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

function makeNotificationInput(
	sellerConfigs: Array<{
		readonly sellerOrderId: string;
		readonly sellerId: string;
		readonly listingName: string;
	}> = [
		{
			sellerOrderId: "seller-order-1",
			sellerId: "seller-1",
			listingName: "Telecaster",
		},
	],
): PurchasePlacedNotificationInput {
	const sellerOrders = sellerConfigs.map((config, index) =>
		SellerOrder.createManualPaymentReady({
			id: config.sellerOrderId,
			purchaseId: "purchase-1",
			sellerId: config.sellerId,
			items: [
				makeItem({
					listingId: `listing-${index + 1}`,
					listingName: config.listingName,
					sellerId: config.sellerId,
					sellerDisplayName: `${config.sellerId} Display`,
				}),
			],
			eventId: `seller-event-${index + 1}`,
			occurredAt: new Date("2026-06-11T00:00:00.000Z"),
		}),
	);
	const total = sellerOrders.reduce(
		(sum, sellerOrder) => sum.add(sellerOrder.subtotal),
		Money.zero("USD"),
	);
	const purchase = Purchase.placeManualPayment({
		id: "purchase-1",
		customerId: "customer-1",
		purchaseNumber: "RM-1001",
		total,
		buyerSnapshot: {
			buyerName: "Pat Buyer",
			buyerEmail: "pat@example.com",
			buyerPhone: null,
			shippingAddress: "123 Market St",
		},
		sellerOrderCount: sellerOrders.length,
		eventId: "purchase-event-1",
		occurredAt: new Date("2026-06-11T00:00:00.000Z"),
	});

	return {
		purchase,
		sellerOrders,
		domainEvents: [
			...purchase.pullDomainEvents(),
			...sellerOrders.flatMap((sellerOrder) => sellerOrder.pullDomainEvents()),
		],
	};
}

function makeFakeContext() {
	const createdNotifications: CreatedNotification[] = [];
	const context = {
		notification: {
			create: vi.fn(
				async ({ data }: { readonly data: CreatedNotification }) => {
					createdNotifications.push(data);

					return {
						id: `notification-${createdNotifications.length}`,
						createdAt: new Date("2026-06-11T00:00:00.000Z"),
						purchaseId: null,
						sellerOrderId: null,
						...data,
					};
				},
			),
		},
	} as unknown as PrismaTransactionContext;

	return {
		context,
		createdNotifications,
	};
}

describe("PrismaPurchasePlacedNotificationCreator", () => {
	it("creates buyer and seller notifications from required domain events", async () => {
		const { context, createdNotifications } = makeFakeContext();
		const input = makeNotificationInput();
		const creator = new PrismaPurchasePlacedNotificationCreator();

		await creator.createForPurchasePlaced(context, input);

		expect(createdNotifications).toEqual([
			{
				userId: "customer-1",
				purchaseId: "purchase-1",
				sellerOrderId: null,
				message:
					"Your purchase #RM-1001 has been placed successfully! Total: USD 250.00",
				isRead: false,
			},
			{
				userId: "seller-1",
				purchaseId: "purchase-1",
				sellerOrderId: "seller-order-1",
				message:
					"New seller order for purchase #RM-1001: Telecaster. Amount: USD 250.00",
				isRead: false,
			},
		]);
		expect(context.notification.create).toHaveBeenCalledTimes(2);
	});

	it("fails when the PurchasePlaced event is missing", async () => {
		const { context } = makeFakeContext();
		const input = makeNotificationInput();
		const creator = new PrismaPurchasePlacedNotificationCreator();

		await expect(
			creator.createForPurchasePlaced(context, {
				...input,
				domainEvents: input.domainEvents.filter(
					(event) => event.eventName !== "PurchasePlaced",
				),
			}),
		).rejects.toThrow(PurchaseNotificationCreationError);
	});

	it("fails when a SellerOrderCreated event is missing for a seller order", async () => {
		const { context } = makeFakeContext();
		const input = makeNotificationInput([
			{
				sellerOrderId: "seller-order-1",
				sellerId: "seller-1",
				listingName: "Telecaster",
			},
			{
				sellerOrderId: "seller-order-2",
				sellerId: "seller-2",
				listingName: "Jazzmaster",
			},
		]);
		const creator = new PrismaPurchasePlacedNotificationCreator();

		await expect(
			creator.createForPurchasePlaced(context, {
				...input,
				domainEvents: input.domainEvents.filter(
					(event) =>
						event.eventName !== "SellerOrderCreated" ||
						event.payload.sellerOrderId !== "seller-order-2",
				),
			}),
		).rejects.toThrow(
			"Purchase notification creation requires one SellerOrderCreated event per seller order",
		);
	});

	it.each([
		["purchase id", { purchaseId: "purchase-2" }],
		["customer id", { customerId: "customer-2" }],
		["total", { totalAmountCents: 1 }],
		["currency", { currencyCode: "EUR" }],
	])("fails when the PurchasePlaced event has wrong %s", async (_field, patch) => {
		const { context } = makeFakeContext();
		const input = makeNotificationInput();
		const creator = new PrismaPurchasePlacedNotificationCreator();

		await expect(
			creator.createForPurchasePlaced(
				context,
				withWrongEventPayload(input, "PurchasePlaced", patch),
			),
		).rejects.toThrow(
			"PurchasePlaced event is inconsistent with purchase purchase-1",
		);
	});

	it.each([
		["purchase id", { purchaseId: "purchase-2" }],
		["seller id", { sellerId: "seller-2" }],
		["subtotal", { subtotalCents: 1 }],
		["currency", { currencyCode: "EUR" }],
	])("fails when a SellerOrderCreated event has wrong %s", async (_field, patch) => {
		const { context } = makeFakeContext();
		const input = makeNotificationInput();
		const creator = new PrismaPurchasePlacedNotificationCreator();

		await expect(
			creator.createForPurchasePlaced(
				context,
				withWrongEventPayload(input, "SellerOrderCreated", patch),
			),
		).rejects.toThrow(
			"SellerOrderCreated event is inconsistent with seller order seller-order-1",
		);
	});
});

function withWrongEventPayload(
	input: PurchasePlacedNotificationInput,
	eventName: "PurchasePlaced" | "SellerOrderCreated",
	payloadPatch: Record<string, unknown>,
): PurchasePlacedNotificationInput {
	let replaced = false;

	return {
		...input,
		domainEvents: input.domainEvents.map((event) => {
			if (replaced || event.eventName !== eventName) {
				return event;
			}

			replaced = true;

			return {
				...event,
				payload: {
					...event.payload,
					...payloadPatch,
				},
			};
		}),
	};
}
