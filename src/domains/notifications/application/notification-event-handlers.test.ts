import { describe, expect, it } from "vitest";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
import type { CreateNotificationCommand } from "../dto/notification";
import {
	createListingModerationNotification,
	createPurchasePlacedNotifications,
} from "./notification-event-handlers";

describe("notification event handlers", () => {
	it("creates buyer and seller notifications from purchase placement events", async () => {
		const notifications = new CreatedNotifications();

		await createPurchasePlacedNotifications(
			{
				purchase: {
					id: "purchase-1",
					customerId: "customer-1",
					purchaseNumber: "RM-1001",
					totalAmountCents: 250_00,
					currencyCode: "USD",
				},
				sellerOrders: [
					{
						id: "seller-order-1",
						purchaseId: "purchase-1",
						sellerId: "seller-1",
						listingNames: ["Telecaster"],
						subtotalCents: 250_00,
						currencyCode: "USD",
					},
				],
				domainEvents: [
					domainEvent("PurchasePlaced", "purchase-1", {
						purchaseId: "purchase-1",
						customerId: "customer-1",
						purchaseNumber: "RM-1001",
						totalAmountCents: 250_00,
						currencyCode: "USD",
					}),
					domainEvent("SellerOrderCreated", "seller-order-1", {
						sellerOrderId: "seller-order-1",
						purchaseId: "purchase-1",
						sellerId: "seller-1",
						subtotalCents: 250_00,
						currencyCode: "USD",
					}),
				],
			},
			notifications,
		);

		expect(notifications.created).toEqual([
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
	});

	it("creates listing moderation notifications from listing lifecycle events", async () => {
		const notifications = new CreatedNotifications();

		await createListingModerationNotification(
			{
				event: domainEvent("ListingApproved", "listing-1", {
					listingId: "listing-1",
					sellerId: "seller-1",
				}),
				listingName: "Telecaster",
			},
			notifications,
		);
		await createListingModerationNotification(
			{
				event: domainEvent("ListingDeclined", "listing-2", {
					listingId: "listing-2",
					sellerId: "seller-2",
				}),
				listingName: "Jazzmaster",
			},
			notifications,
		);

		expect(notifications.created).toEqual([
			{
				userId: "seller-1",
				purchaseId: null,
				sellerOrderId: null,
				message:
					"Great News! Your product Telecaster has been approved and live at the RiffMarket shop",
				isRead: false,
			},
			{
				userId: "seller-2",
				purchaseId: null,
				sellerOrderId: null,
				message: "Your product Jazzmaster has been declined by the admin",
				isRead: false,
			},
		]);
	});
});

class CreatedNotifications {
	readonly created: CreateNotificationCommand[] = [];

	async create(command: CreateNotificationCommand) {
		this.created.push(command);

		return {
			id: `notification-${this.created.length}`,
			userId: command.userId,
			purchaseId: command.purchaseId ?? null,
			sellerOrderId: command.sellerOrderId ?? null,
			message: command.message,
			isRead: command.isRead ?? false,
			createdAt: "2026-06-23T00:00:00.000Z",
		};
	}
}

function domainEvent<
	TName extends string,
	TPayload extends Readonly<Record<string, unknown>>,
>(
	eventName: TName,
	aggregateId: string,
	payload: TPayload,
): DomainEvent<TName, TPayload> {
	return {
		eventId: `${eventName}-${aggregateId}`,
		eventName,
		aggregateId,
		occurredAt: new Date("2026-06-23T00:00:00.000Z"),
		payload,
	};
}
