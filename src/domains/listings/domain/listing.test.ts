import { describe, expect, it } from "vitest";

import { Money } from "@/domains/shared/domain/money";
import {
	isListingOrderable,
	Listing,
	ListingLifecycleError,
	ListingPurchaseError,
	type ListingSnapshot,
} from "./listing";

function makeListing(overrides: Partial<ListingSnapshot> = {}) {
	return Listing.fromExisting({
		id: "listing-1",
		sellerId: "seller-1",
		sellerDisplayName: "A Seller",
		name: "Telecaster",
		brand: "Fender",
		model: "American Standard",
		category: "ELECTRIC",
		condition: "USED",
		description: "A listing",
		primaryImageUrl: "https://cdn.example.com/listing.jpg",
		price: Money.fromMinor(1250, "TWD"),
		stock: 3,
		status: "APPROVED",
		...overrides,
	});
}

describe("Listing purchase behavior", () => {
	it.each([
		["APPROVED", 1, true],
		["APPROVED", 0, false],
		["PENDING", 1, false],
		["DECLINED", 1, false],
		["WITHDRAWN", 1, false],
	] as const)("returns %s stock %s orderability as %s", (status, stock, expected) => {
		expect(isListingOrderable(status, stock)).toBe(expected);
	});

	it("reserves approved listing stock and returns a purchase snapshot", () => {
		const listing = makeListing();

		const snapshot = listing.reserveForPurchase(2);

		expect(listing.stock).toBe(1);
		expect(snapshot).toEqual({
			listingId: "listing-1",
			listingName: "Telecaster",
			brand: "Fender",
			model: "American Standard",
			category: "ELECTRIC",
			condition: "USED",
			primaryImageUrl: "https://cdn.example.com/listing.jpg",
			sellerId: "seller-1",
			sellerDisplayName: "A Seller",
			unitPrice: Money.fromMinor(1250, "TWD"),
			quantity: 2,
		});
	});

	it.each([
		"PENDING",
		"DECLINED",
		"WITHDRAWN",
	] as const)("rejects %s listings as not orderable", (status) => {
		const listing = makeListing({ status });

		expect(() => listing.reserveForPurchase(1)).toThrow(
			new ListingPurchaseError(
				"LISTING_NOT_ORDERABLE",
				"Listing must be approved before purchase",
			),
		);
		expect(listing.stock).toBe(3);
	});

	it("rejects insufficient stock without reducing stock", () => {
		const listing = makeListing({ stock: 1 });

		expect(() => listing.reserveForPurchase(2)).toThrow(
			new ListingPurchaseError(
				"LISTING_INSUFFICIENT_STOCK",
				"Insufficient stock for listing listing-1",
			),
		);
		expect(listing.stock).toBe(1);
	});

	it.each([0, -1, 1.5])("rejects invalid quantity %s", (quantity) => {
		const listing = makeListing();

		expect(() => listing.reserveForPurchase(quantity)).toThrow(
			new ListingPurchaseError(
				"LISTING_INVALID_QUANTITY",
				"Listing purchase quantity must be a positive safe integer",
			),
		);
		expect(listing.stock).toBe(3);
	});
});

describe("Listing lifecycle behavior", () => {
	const admin = { id: "admin-1", role: "ADMIN" } as const;
	const seller = { id: "seller-1", role: "SELLER" } as const;

	it("approves a pending listing and records a lifecycle event", () => {
		const listing = makeListing({ status: "PENDING" });

		listing.approve(admin);

		expect(listing.status).toBe("APPROVED");
		expect(listing.pullDomainEvents()).toMatchObject([
			{
				eventName: "ListingApproved",
				aggregateId: "listing-1",
				payload: {
					listingId: "listing-1",
					sellerId: "seller-1",
				},
				metadata: { actor: admin },
			},
		]);
		expect(listing.pullDomainEvents()).toEqual([]);
	});

	it("declines a pending listing without deleting the aggregate", () => {
		const listing = makeListing({ status: "PENDING" });

		listing.decline(admin);

		expect(listing.status).toBe("DECLINED");
		expect(listing.id).toBe("listing-1");
		expect(listing.pullDomainEvents()).toMatchObject([
			{
				eventName: "ListingDeclined",
				aggregateId: "listing-1",
				payload: {
					listingId: "listing-1",
					sellerId: "seller-1",
				},
				metadata: { actor: admin },
			},
		]);
	});

	it("withdraws an active listing", () => {
		const listing = makeListing({ status: "APPROVED" });

		listing.withdraw(seller);

		expect(listing.status).toBe("WITHDRAWN");
		expect(listing.pullDomainEvents()).toMatchObject([
			{
				eventName: "ListingWithdrawn",
				metadata: { actor: seller },
			},
		]);
	});

	it("rejects duplicate lifecycle transitions", () => {
		expect(() => makeListing({ status: "APPROVED" }).approve(admin)).toThrow(
			new ListingLifecycleError(
				"LISTING_ALREADY_APPROVED",
				"Listing is already approved",
			),
		);
		expect(() => makeListing({ status: "DECLINED" }).decline(admin)).toThrow(
			new ListingLifecycleError(
				"LISTING_ALREADY_DECLINED",
				"Listing is already declined",
			),
		);
		expect(() => makeListing({ status: "WITHDRAWN" }).withdraw(seller)).toThrow(
			new ListingLifecycleError(
				"LISTING_ALREADY_WITHDRAWN",
				"Listing is already withdrawn",
			),
		);
	});

	it("does not allow withdrawn listings back into moderation", () => {
		const listing = makeListing({ status: "WITHDRAWN" });

		expect(() => listing.approve(admin)).toThrow(
			new ListingLifecycleError(
				"LISTING_WITHDRAWN_CANNOT_BE_APPROVED",
				"Withdrawn listings cannot be approved",
			),
		);
		expect(() => listing.decline(admin)).toThrow(
			new ListingLifecycleError(
				"LISTING_WITHDRAWN_CANNOT_BE_DECLINED",
				"Withdrawn listings cannot be declined",
			),
		);
		expect(listing.status).toBe("WITHDRAWN");
	});
});

describe("Listing edit behavior", () => {
	const seller = { id: "seller-1", role: "SELLER" } as const;
	const admin = { id: "admin-1", role: "ADMIN" } as const;

	it("seller edits return the listing to pending", () => {
		const listing = makeListing({ status: "APPROVED", brand: "Fender" });

		listing.applyEdit(seller, {
			name: "Updated",
			brand: " Fender   Offset ",
		});

		expect(listing.status).toBe("PENDING");
		expect(listing.isApproved).toBe(false);
		expect(listing.name).toBe("Updated");
		expect(listing.brand).toBe("Fender Offset");
	});

	it("admin edits auto-approve the listing", () => {
		const listing = makeListing({ status: "PENDING" });

		listing.applyEdit(admin, { name: "Admin update" });

		expect(listing.status).toBe("APPROVED");
		expect(listing.isApproved).toBe(true);
		expect(listing.name).toBe("Admin update");
	});
});
