import { describe, expect, it } from "vitest";

import {
	type ChangeSellerOrderStatusCommand,
	type ChangeSellerOrderStatusDependencies,
	changeSellerOrderStatus,
	type ListingStockReleaseItem,
	type ListingStockReleasePort,
	type SellerOrderStatusChangeRecord,
	type SellerOrderStatusRepositoryPort,
} from "@/domains/ordering/application/change-seller-order-status";
import {
	SellerOrder,
	type SellerOrderItemSnapshot,
	type SellerOrderStatus,
} from "@/domains/ordering/domain/seller-order";
import type { UnitOfWork } from "@/domains/shared/application/unit-of-work";
import type { Actor } from "@/domains/shared/domain/actor";

type FakeTransaction = {
	readonly id: string;
};

describe("changeSellerOrderStatus", () => {
	it("allows the owning seller to process a new seller order", async () => {
		const deps = makeDependencies(makeRecord());
		const changeStatus = makeChangeStatus(deps);

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
		expect(deps.sellerOrders.saved?.sellerOrder.status).toBe("PROCESSING");
		expect(deps.listingStock.released).toEqual([]);
	});

	it("blocks sellers from updating seller orders owned by another seller", async () => {
		const deps = makeDependencies(makeRecord());
		const changeStatus = makeChangeStatus(deps);

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
		expect(deps.sellerOrders.saved).toBeUndefined();
		expect(deps.listingStock.released).toEqual([]);
	});

	it("releases listing stock when a customer cancels their seller order", async () => {
		const deps = makeDependencies(
			makeRecord({
				items: [
					makeItem({
						listingId: "listing-1",
						quantity: 2,
						subTotalCents: 250_00,
					}),
				],
			}),
		);
		const changeStatus = makeChangeStatus(deps);

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
		expect(deps.sellerOrders.saved?.sellerOrder.status).toBe("CANCELED");
		expect(deps.listingStock.released).toEqual([
			{ listingId: "listing-1", quantity: 2 },
		]);
	});

	it("does not release stock when the seller order is already canceled", async () => {
		const deps = makeDependencies(makeRecord({ status: "CANCELED" }));
		const changeStatus = makeChangeStatus(deps);

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
		expect(deps.sellerOrders.saved).toBeUndefined();
		expect(deps.listingStock.released).toEqual([]);
	});

	it("does not release stock when another request wins the status write", async () => {
		const deps = makeDependencies(makeRecord());
		deps.sellerOrders.shouldUpdate = false;
		const changeStatus = makeChangeStatus(deps);

		const result = await changeStatus(
			{ id: "customer-1", role: "CUSTOMER" },
			{ sellerOrderId: "seller-order-1", status: "CANCELED" },
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_INVALID_TRANSITION",
				message: "Seller order status changed by another request",
			},
		});
		expect(deps.listingStock.released).toEqual([]);
	});

	it("blocks customers from canceling seller orders for another customer purchase", async () => {
		const deps = makeDependencies(makeRecord({ customerId: "customer-2" }));
		const changeStatus = makeChangeStatus(deps);

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
		const deps = makeDependencies(makeRecord());
		const changeStatus = makeChangeStatus(deps);

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
		const deps = makeDependencies(makeRecord({ status: "PROCESSING" }));
		const changeStatus = makeChangeStatus(deps);

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
		expect(deps.sellerOrders.saved).toBeUndefined();
	});

	it("rejects status commands that are not valid for the order's current status", async () => {
		const deps = makeDependencies(makeRecord());
		const changeStatus = makeChangeStatus(deps);

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
				code: "CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
				message: "Cannot command seller order status DELIVERED",
			},
		});
	});

	it("allows the owning seller to cancel an on-hold seller order", async () => {
		const deps = makeDependencies(makeRecord({ status: "ON_HOLD_PAYMENT" }));
		const changeStatus = makeChangeStatus(deps);

		const result = await changeStatus(
			{ id: "seller-1", role: "SELLER" },
			{ sellerOrderId: "seller-order-1", status: "CANCELED" },
		);

		expect(result).toMatchObject({
			ok: true,
			value: {
				status: "CANCELED",
			},
		});
		expect(deps.listingStock.released).toEqual([
			{ listingId: "listing-1", quantity: 1 },
		]);
	});

	it("returns not found for missing seller orders", async () => {
		const deps = makeDependencies(null);
		const changeStatus = makeChangeStatus(deps);

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

function makeChangeStatus(
	dependencies: ChangeSellerOrderStatusDependencies<FakeTransaction> & {
		readonly sellerOrders: FakeSellerOrderStatusRepository;
		readonly listingStock: FakeListingStockRelease;
	},
) {
	return (actor: Actor, command: ChangeSellerOrderStatusCommand) =>
		changeSellerOrderStatus(actor, command, dependencies);
}

function makeDependencies(record: SellerOrderStatusChangeRecord | null) {
	return {
		sellerOrders: new FakeSellerOrderStatusRepository(record),
		listingStock: new FakeListingStockRelease(),
		unitOfWork: new FakeUnitOfWork(),
	};
}

class FakeUnitOfWork implements UnitOfWork<FakeTransaction> {
	readonly context: FakeTransaction = {
		id: "tx-1",
	};

	async runInTransaction<TResult>(
		handler: (context: FakeTransaction) => Promise<TResult>,
	): Promise<TResult> {
		return handler(this.context);
	}
}

class FakeListingStockRelease
	implements ListingStockReleasePort<FakeTransaction>
{
	released: ListingStockReleaseItem[] = [];

	async releaseForCanceledOrder(
		_context: FakeTransaction,
		items: readonly ListingStockReleaseItem[],
	) {
		this.released.push(...items);
	}
}

class FakeSellerOrderStatusRepository
	implements SellerOrderStatusRepositoryPort<FakeTransaction>
{
	saved:
		| {
				sellerOrder: SellerOrder;
				expectedCurrentStatus: SellerOrderStatus;
		  }
		| undefined;
	shouldUpdate = true;

	constructor(private readonly record: SellerOrderStatusChangeRecord | null) {}

	async findById(_sellerOrderId: string) {
		return this.record;
	}

	async save(
		_context: FakeTransaction,
		sellerOrder: SellerOrder,
		expectedCurrentStatus: SellerOrderStatus,
	) {
		if (!this.shouldUpdate) {
			return false;
		}

		this.saved = {
			sellerOrder,
			expectedCurrentStatus,
		};
		return true;
	}
}

function makeRecord(
	overrides: {
		readonly customerId?: string;
		readonly sellerId?: string;
		readonly status?: SellerOrderStatus;
		readonly trackingNumber?: string | null;
		readonly items?: SellerOrderItemSnapshot[];
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
			items: overrides.items ?? [makeItem({ sellerId })],
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
