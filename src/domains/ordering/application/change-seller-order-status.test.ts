import { describe, expect, it } from "vitest";

import {
	type ChangeSellerOrderStatusCommand,
	changeSellerOrderStatus,
	type SellerOrderStatusChangeRecord,
	type SellerOrderStatusRepositoryPort,
} from "@/domains/ordering/application/change-seller-order-status";
import {
	SellerOrder,
	type SellerOrderItemSnapshot,
	type SellerOrderStatus,
	type SellerOrderStatusChangedEvent,
} from "@/domains/ordering/domain/seller-order";
import type { Actor } from "@/domains/shared/domain/actor";

describe("changeSellerOrderStatus", () => {
	it("allows the owning seller to process a new seller order", async () => {
		const repo = new FakeSellerOrderStatusRepository(makeRecord());
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "seller-1", role: "SELLER" },
			{ sellerOrderId: "seller-order-1", status: "PROCESSING" },
		);

		expect(result).toEqual({
			ok: true,
			value: {
				sellerOrderId: "seller-order-1",
				purchaseId: "purchase-1",
				status: "PROCESSING",
				trackingNumber: null,
			},
		});
		expect(repo.saved?.sellerOrder.status).toBe("PROCESSING");
		expect(repo.saved?.domainEvents).toEqual([
			expect.objectContaining({
				eventName: "SellerOrderStatusChanged",
				payload: expect.objectContaining({
					previousStatus: "NEW",
					nextStatus: "PROCESSING",
				}),
			}),
		]);
	});

	it("blocks sellers from updating seller orders owned by another seller", async () => {
		const repo = new FakeSellerOrderStatusRepository(makeRecord());
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "seller-2", role: "SELLER" },
			{ sellerOrderId: "seller-order-1", status: "PROCESSING" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
				message: "Unauthorized, you can only update your own seller orders",
			},
		});
		expect(repo.saved).toBeUndefined();
	});

	it("allows a customer to cancel seller orders for their own purchase", async () => {
		const repo = new FakeSellerOrderStatusRepository(makeRecord());
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "customer-1", role: "CUSTOMER" },
			{ sellerOrderId: "seller-order-1", status: "CANCELED" },
		);

		expect(result).toMatchObject({
			ok: true,
			value: {
				status: "CANCELED",
			},
		});
		expect(repo.saved?.sellerOrder.status).toBe("CANCELED");
	});

	it("blocks customers from canceling seller orders for another customer purchase", async () => {
		const repo = new FakeSellerOrderStatusRepository(
			makeRecord({ customerId: "customer-2" }),
		);
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "customer-1", role: "CUSTOMER" },
			{ sellerOrderId: "seller-order-1", status: "CANCELED" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
				message:
					"Unauthorized, you can only cancel seller orders for your own purchases",
			},
		});
	});

	it("blocks customers from seller fulfillment status updates", async () => {
		const repo = new FakeSellerOrderStatusRepository(makeRecord());
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "customer-1", role: "CUSTOMER" },
			{ sellerOrderId: "seller-order-1", status: "PROCESSING" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
				message: "Unauthorized, customers can only cancel seller orders",
			},
		});
	});

	it("requires a tracking number to ship seller orders", async () => {
		const repo = new FakeSellerOrderStatusRepository(
			makeRecord({ status: "PROCESSING" }),
		);
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "seller-1", role: "SELLER" },
			{ sellerOrderId: "seller-order-1", status: "SHIPPED" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
				message: "Tracking number is required to ship seller order",
			},
		});
		expect(repo.saved).toBeUndefined();
	});

	it("rejects invalid domain transitions", async () => {
		const repo = new FakeSellerOrderStatusRepository(makeRecord());
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "seller-1", role: "SELLER" },
			{
				sellerOrderId: "seller-order-1",
				status: "DELIVERED",
			},
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_INVALID_TRANSITION",
				message: "Cannot change seller order status from NEW to DELIVERED",
			},
		});
	});

	it("returns not found for missing seller orders", async () => {
		const repo = new FakeSellerOrderStatusRepository(null);
		const changeStatus = makeChangeStatus(repo);

		const result = await changeStatus(
			{ id: "seller-1", role: "SELLER" },
			{ sellerOrderId: "missing", status: "PROCESSING" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_NOT_FOUND",
			},
		});
	});
});

function makeChangeStatus(repository: SellerOrderStatusRepositoryPort) {
	return (actor: Actor, command: ChangeSellerOrderStatusCommand) =>
		changeSellerOrderStatus(actor, command, repository);
}

class FakeSellerOrderStatusRepository
	implements SellerOrderStatusRepositoryPort
{
	saved:
		| {
				sellerOrder: SellerOrder;
				domainEvents: SellerOrderStatusChangedEvent[];
		  }
		| undefined;

	constructor(private readonly record: SellerOrderStatusChangeRecord | null) {}

	async findById(_sellerOrderId: string) {
		return this.record;
	}

	async save(
		sellerOrder: SellerOrder,
		domainEvents: SellerOrderStatusChangedEvent[],
	) {
		this.saved = {
			sellerOrder,
			domainEvents,
		};
	}
}

function makeRecord(
	overrides: {
		readonly customerId?: string;
		readonly sellerId?: string;
		readonly status?: SellerOrderStatus;
		readonly trackingNumber?: string | null;
	} = {},
): SellerOrderStatusChangeRecord {
	const sellerId = overrides.sellerId ?? "seller-1";

	return {
		customerId: overrides.customerId ?? "customer-1",
		sellerOrder: SellerOrder.reconstitute({
			id: "seller-order-1",
			purchaseId: "purchase-1",
			sellerId,
			status: overrides.status ?? "NEW",
			trackingNumber: overrides.trackingNumber ?? null,
			items: [makeItem({ sellerId })],
		}),
	};
}

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
		quantity: 1,
		subTotalCents: 125_00,
		currencyCode: "USD",
		...overrides,
	};
}
