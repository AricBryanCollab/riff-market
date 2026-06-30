import { describe, expect, it } from "vitest";

import {
	Listing,
	ListingPurchaseError,
	type ListingSnapshot,
} from "@/domains/listings/domain/listing";
import type { UnitOfWork } from "@/domains/shared/application/unit-of-work";
import type { Actor } from "@/domains/shared/domain/actor";
import { Money } from "@/domains/shared/domain/money";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import type { Purchase } from "../domain/purchase";
import type { SellerOrder } from "../domain/seller-order";
import {
	type ListingsForPurchasePort,
	type PlacePurchaseCommand,
	type PlacePurchaseError,
	type PlacePurchaseItem,
	type PurchaseEntityIdGeneratorPort,
	type PurchaseNumberGeneratorPort,
	type PurchasePersistencePort,
	type PurchasePlacedNotificationCreatorPort,
	type PurchasePlacedNotificationInput,
	placePurchase,
	placePurchaseError,
	type ReservedSellerListingGroup,
	type SellerOrderPersistencePort,
} from "./place-purchase";

type FakeTransaction = {
	readonly id: string;
};

const customer: Actor = {
	id: "customer-1",
	role: "CUSTOMER",
};

function makeCommand(
	items: PlacePurchaseItem[] = [{ listingId: "listing-1", quantity: 1 }],
	overrides: Partial<PlacePurchaseCommand> = {},
): PlacePurchaseCommand {
	return {
		items,
		buyerName: "Pat Buyer",
		buyerEmail: "pat@example.com",
		buyerPhone: null,
		shippingAddress: "123 Market St",
		...overrides,
	};
}

function makeListing(overrides: Partial<ListingSnapshot> = {}) {
	return Listing.reconstitute({
		id: "listing-1",
		sellerId: "seller-1",
		sellerDisplayName: "A Seller",
		name: "Telecaster",
		brand: "Fender",
		model: "American Standard",
		category: "ELECTRIC",
		condition: "USED",
		primaryImageUrl: "https://cdn.example.com/listing-1.jpg",
		price: Money.fromMinor(100_00, "USD"),
		stock: 5,
		status: "APPROVED",
		...overrides,
	});
}

function makeHarness(listings: Listing[]) {
	const unitOfWork = new FakeUnitOfWork();
	const listingPort = new FakeListingsForPurchasePort(listings);
	const purchasePort = new FakePurchasePersistencePort();
	const sellerOrderPort = new FakeSellerOrderPersistencePort();
	const purchaseNumberPort = new FakePurchaseNumberGeneratorPort("RM-1001");
	const entityIdPort = new FakePurchaseEntityIdGeneratorPort([
		"purchase-1",
		"seller-order-1",
		"seller-order-2",
	]);
	const notificationPort = new FakePurchasePlacedNotificationCreator();
	const dependencies = {
		unitOfWork,
		listings: listingPort,
		purchases: purchasePort,
		sellerOrders: sellerOrderPort,
		purchaseNumbers: purchaseNumberPort,
		entityIds: entityIdPort,
		notifications: notificationPort,
	};
	const runPlacePurchase = (actor: Actor, command: PlacePurchaseCommand) =>
		placePurchase(actor, command, dependencies);

	return {
		entityIdPort,
		listingPort,
		notificationPort,
		purchaseNumberPort,
		purchasePort,
		sellerOrderPort,
		unitOfWork,
		runPlacePurchase,
	};
}

describe("PlacePurchase", () => {
	it("allows only customers to place purchases", async () => {
		const { purchasePort, unitOfWork, runPlacePurchase } = makeHarness([
			makeListing(),
		]);

		const result = await runPlacePurchase(
			{ id: "seller-1", role: "SELLER" },
			makeCommand(),
		);

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_UNAUTHORIZED",
				kind: "authorization",
			}),
		});
		expect(unitOfWork.transactionCount).toBe(0);
		expect(purchasePort.saved).toBeUndefined();
	});

	it("rejects empty purchases before opening a transaction", async () => {
		const { unitOfWork, runPlacePurchase } = makeHarness([makeListing()]);

		const result = await runPlacePurchase(customer, makeCommand([]));

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_EMPTY_ITEMS",
				kind: "validation",
			}),
		});
		expect(unitOfWork.transactionCount).toBe(0);
	});

	it("rejects invalid item quantities before opening a transaction", async () => {
		const { unitOfWork, runPlacePurchase } = makeHarness([makeListing()]);

		const result = await runPlacePurchase(
			customer,
			makeCommand([{ listingId: "listing-1", quantity: 0 }]),
		);

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_INVALID_ITEM_QUANTITY",
				kind: "validation",
			}),
		});
		expect(unitOfWork.transactionCount).toBe(0);
	});

	it.each([
		["buyer name", { buyerName: " " }],
		["buyer email", { buyerEmail: "" }],
		["shipping address", { shippingAddress: " " }],
	] as const)("rejects missing %s before opening a transaction", async (_field, overrides) => {
		const { unitOfWork, runPlacePurchase } = makeHarness([makeListing()]);

		const result = await runPlacePurchase(
			customer,
			makeCommand(undefined, overrides),
		);

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_INVALID_BUYER_SNAPSHOT",
				kind: "validation",
			}),
		});
		expect(unitOfWork.transactionCount).toBe(0);
	});

	it("rejects missing listings through the listing reservation port", async () => {
		const { purchasePort, unitOfWork, runPlacePurchase } = makeHarness([]);

		const result = await runPlacePurchase(customer, makeCommand());

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_LISTING_NOT_FOUND",
				kind: "not-found",
			}),
		});
		expect(unitOfWork.rolledBack).toBe(true);
		expect(purchasePort.saved).toBeUndefined();
	});

	it("rejects unapproved listings through the listing reservation port", async () => {
		const { purchasePort, runPlacePurchase } = makeHarness([
			makeListing({ status: "PENDING" }),
		]);

		const result = await runPlacePurchase(customer, makeCommand());

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_LISTING_NOT_ORDERABLE",
				kind: "conflict",
			}),
		});
		expect(purchasePort.saved).toBeUndefined();
	});

	it("rejects insufficient stock through the listing reservation port", async () => {
		const { purchasePort, runPlacePurchase } = makeHarness([
			makeListing({ stock: 1 }),
		]);

		const result = await runPlacePurchase(
			customer,
			makeCommand([{ listingId: "listing-1", quantity: 2 }]),
		);

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_INSUFFICIENT_STOCK",
				kind: "conflict",
			}),
		});
		expect(purchasePort.saved).toBeUndefined();
	});

	it("creates one purchase and independent seller orders grouped by seller", async () => {
		const listingOne = makeListing({
			id: "listing-1",
			sellerId: "seller-1",
			sellerDisplayName: "A Seller",
			price: Money.fromMinor(100_00, "USD"),
			stock: 5,
		});
		const listingTwo = makeListing({
			id: "listing-2",
			sellerId: "seller-2",
			sellerDisplayName: "B Seller",
			name: "Jazzmaster",
			price: Money.fromMinor(50_00, "USD"),
			stock: 5,
		});
		const {
			entityIdPort,
			listingPort,
			notificationPort,
			purchaseNumberPort,
			purchasePort,
			sellerOrderPort,
			unitOfWork,
			runPlacePurchase,
		} = makeHarness([listingOne, listingTwo]);

		const result = await runPlacePurchase(
			customer,
			makeCommand([
				{ listingId: "listing-1", quantity: 1 },
				{ listingId: "listing-2", quantity: 1 },
				{ listingId: "listing-2", quantity: 1 },
			]),
		);

		expect(result).toEqual({
			ok: true,
			value: {
				purchaseId: "purchase-1",
				purchaseNumber: "RM-1001",
				total: Money.fromMinor(200_00, "USD"),
				paymentStatus: "MANUALLY_CONFIRMED",
				status: "OPEN",
				sellerOrderIds: ["seller-order-1", "seller-order-2"],
			},
		});
		expect(unitOfWork.transactionCount).toBe(1);
		expect(unitOfWork.rolledBack).toBe(false);
		expect(listingPort.reservedWith).toBe(unitOfWork.context);
		expect(entityIdPort.generatedWith).toEqual([
			unitOfWork.context,
			unitOfWork.context,
			unitOfWork.context,
		]);
		expect(purchaseNumberPort.generatedWith).toBe(unitOfWork.context);
		expect(purchasePort.savedWith).toBe(unitOfWork.context);
		expect(sellerOrderPort.savedWith).toBe(unitOfWork.context);
		expect(notificationPort.createdWith).toBe(unitOfWork.context);
		expect(purchasePort.saved).toMatchObject({
			customerId: "customer-1",
			purchaseNumber: "RM-1001",
			total: Money.fromMinor(200_00, "USD"),
			paymentStatus: "MANUALLY_CONFIRMED",
			status: "OPEN",
			sellerOrderCount: 2,
		});
		expect(sellerOrderPort.saved).toHaveLength(2);
		expect(sellerOrderPort.saved).toEqual([
			expect.objectContaining({
				purchaseId: purchasePort.saved?.id,
				sellerId: "seller-1",
				subtotal: Money.fromMinor(100_00, "USD"),
				status: "NEW",
				trackingNumber: null,
			}),
			expect.objectContaining({
				purchaseId: purchasePort.saved?.id,
				sellerId: "seller-2",
				subtotal: Money.fromMinor(100_00, "USD"),
				status: "NEW",
				trackingNumber: null,
			}),
		]);
		expect(sellerOrderPort.saved[1]?.items).toEqual([
			expect.objectContaining({
				listingId: "listing-2",
				sellerId: "seller-2",
				unitPriceCents: 50_00,
				quantity: 2,
				subTotalCents: 100_00,
				currencyCode: "USD",
			}),
		]);
		expect(notificationPort.createdFrom).toMatchObject({
			purchase: purchasePort.saved,
			sellerOrders: sellerOrderPort.saved,
		});
		expect(
			notificationPort.createdFrom?.domainEvents.map(
				(event) => event.eventName,
			),
		).toEqual(["PurchasePlaced", "SellerOrderCreated", "SellerOrderCreated"]);
		expect(listingPort.aggregatedRequests).toEqual([
			{ listingId: "listing-1", quantity: 1 },
			{ listingId: "listing-2", quantity: 2 },
		]);
		expect(purchaseNumberPort.generatedWith).toBe(unitOfWork.context);
		expect(listingOne.stock).toBe(4);
		expect(listingTwo.stock).toBe(3);
	});
});

class FakeUnitOfWork implements UnitOfWork<FakeTransaction> {
	readonly context: FakeTransaction = {
		id: "tx-1",
	};

	transactionCount = 0;
	rolledBack = false;

	async runInTransaction<TResult>(
		handler: (context: FakeTransaction) => Promise<TResult>,
	): Promise<TResult> {
		this.transactionCount += 1;

		try {
			return await handler(this.context);
		} catch (error) {
			this.rolledBack = true;
			throw error;
		}
	}
}

class FakeListingsForPurchasePort
	implements ListingsForPurchasePort<FakeTransaction>
{
	readonly listingsById: Map<string, Listing>;
	aggregatedRequests: PlacePurchaseItem[] = [];
	reservedWith: FakeTransaction | undefined;

	constructor(listings: Listing[]) {
		this.listingsById = new Map(
			listings.map((listing) => [listing.id, listing]),
		);
	}

	async reserveForPurchase(
		context: FakeTransaction,
		items: PlacePurchaseItem[],
	): Promise<Result<ReservedSellerListingGroup[], PlacePurchaseError>> {
		this.reservedWith = context;

		const aggregatedItems = aggregateItems(items);
		this.aggregatedRequests = aggregatedItems;
		const groupsBySellerId = new Map<string, ReservedSellerListingGroup>();

		for (const item of aggregatedItems) {
			const listing = this.listingsById.get(item.listingId);

			if (!listing) {
				return err(
					placePurchaseError(
						"PLACE_PURCHASE_LISTING_NOT_FOUND",
						`Listing ${item.listingId} was not found`,
						"not-found",
					),
				);
			}

			try {
				const reservedItem = listing.reserveForPurchase(item.quantity);
				const existingGroup = groupsBySellerId.get(reservedItem.sellerId);

				if (existingGroup) {
					existingGroup.items.push(reservedItem);
				} else {
					groupsBySellerId.set(reservedItem.sellerId, {
						sellerId: reservedItem.sellerId,
						items: [reservedItem],
					});
				}
			} catch (error) {
				return err(mapListingReservationError(error));
			}
		}

		return ok([...groupsBySellerId.values()]);
	}
}

class FakePurchasePersistencePort
	implements PurchasePersistencePort<FakeTransaction>
{
	saved: Purchase | undefined;
	savedWith: FakeTransaction | undefined;

	async save(context: FakeTransaction, purchase: Purchase) {
		this.savedWith = context;
		this.saved = purchase;
	}
}

class FakeSellerOrderPersistencePort
	implements SellerOrderPersistencePort<FakeTransaction>
{
	readonly saved: SellerOrder[] = [];
	savedWith: FakeTransaction | undefined;

	async saveMany(context: FakeTransaction, sellerOrders: SellerOrder[]) {
		this.savedWith = context;
		this.saved.push(...sellerOrders);
	}
}

class FakePurchaseNumberGeneratorPort
	implements PurchaseNumberGeneratorPort<FakeTransaction>
{
	generatedWith: FakeTransaction | undefined;

	constructor(private readonly purchaseNumber: string) {}

	async generate(context: FakeTransaction) {
		this.generatedWith = context;

		return this.purchaseNumber;
	}
}

class FakePurchaseEntityIdGeneratorPort
	implements PurchaseEntityIdGeneratorPort<FakeTransaction>
{
	private next = 0;
	readonly generatedWith: FakeTransaction[] = [];

	constructor(private readonly ids: string[]) {}

	async generate(context: FakeTransaction) {
		this.generatedWith.push(context);
		const id = this.ids[this.next];
		this.next += 1;

		if (id === undefined) {
			throw new Error("No fake purchase entity ID configured");
		}

		return id;
	}
}

class FakePurchasePlacedNotificationCreator
	implements PurchasePlacedNotificationCreatorPort<FakeTransaction>
{
	createdFrom: PurchasePlacedNotificationInput | undefined;
	createdWith: FakeTransaction | undefined;

	async createForPurchasePlaced(
		context: FakeTransaction,
		input: PurchasePlacedNotificationInput,
	) {
		this.createdWith = context;
		this.createdFrom = input;
	}
}

function aggregateItems(items: PlacePurchaseItem[]) {
	const aggregated = new Map<string, number>();

	for (const item of items) {
		aggregated.set(
			item.listingId,
			(aggregated.get(item.listingId) ?? 0) + item.quantity,
		);
	}

	return [...aggregated.entries()].map(([listingId, quantity]) => ({
		listingId,
		quantity,
	}));
}

function mapListingReservationError(error: unknown) {
	if (error instanceof ListingPurchaseError) {
		if (error.code === "LISTING_NOT_ORDERABLE") {
			return placePurchaseError(
				"PLACE_PURCHASE_LISTING_NOT_ORDERABLE",
				error.message,
				"conflict",
			);
		}

		if (error.code === "LISTING_INSUFFICIENT_STOCK") {
			return placePurchaseError(
				"PLACE_PURCHASE_INSUFFICIENT_STOCK",
				error.message,
				"conflict",
			);
		}
	}

	return placePurchaseError(
		"PLACE_PURCHASE_INVARIANT_FAILED",
		error instanceof Error ? error.message : "Listing reservation failed",
		"invariant",
		error,
	);
}
