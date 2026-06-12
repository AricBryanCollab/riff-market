import { describe, expect, it } from "vitest";

import { Money } from "@/domains/shared/domain/money";
import { Listing, ListingPurchaseError, type ListingSnapshot } from "./listing";

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
		primaryImageUrl: "https://cdn.example.com/listing.jpg",
		price: Money.fromCents(125_00, "USD"),
		stock: 3,
		status: "APPROVED",
		...overrides,
	});
}

describe("Listing purchase behavior", () => {
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
			unitPrice: Money.fromCents(125_00, "USD"),
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
