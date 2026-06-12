import type { Money } from "@/domains/shared/domain/money";

export const listingStatuses = [
	"PENDING",
	"APPROVED",
	"DECLINED",
	"WITHDRAWN",
] as const;

export type ListingStatus = (typeof listingStatuses)[number];

export type ListingSnapshot = {
	readonly id: string;
	readonly sellerId: string;
	readonly sellerDisplayName: string;
	readonly name: string;
	readonly brand: string;
	readonly model: string;
	readonly category: string;
	readonly condition: string;
	readonly primaryImageUrl: string;
	readonly price: Money;
	readonly stock: number;
	readonly status: ListingStatus;
};

export type ReservedListingItemSnapshot = {
	readonly listingId: string;
	readonly listingName: string;
	readonly brand: string;
	readonly model: string;
	readonly category: string;
	readonly condition: string;
	readonly primaryImageUrl: string;
	readonly sellerId: string;
	readonly sellerDisplayName: string;
	readonly unitPrice: Money;
	readonly quantity: number;
};

export type ListingPurchaseErrorCode =
	| "LISTING_NOT_ORDERABLE"
	| "LISTING_INSUFFICIENT_STOCK"
	| "LISTING_INVALID_QUANTITY";

export class ListingPurchaseError extends Error {
	readonly code: ListingPurchaseErrorCode;

	constructor(code: ListingPurchaseErrorCode, message: string) {
		super(message);
		this.name = "ListingPurchaseError";
		this.code = code;
	}
}

export class Listing {
	readonly id: string;
	readonly sellerId: string;
	readonly sellerDisplayName: string;
	readonly name: string;
	readonly brand: string;
	readonly model: string;
	readonly category: string;
	readonly condition: string;
	readonly primaryImageUrl: string;
	readonly price: Money;
	readonly status: ListingStatus;

	private availableStock: number;

	private constructor(snapshot: ListingSnapshot) {
		assertPresent(snapshot.id, "Listing ID");
		assertPresent(snapshot.sellerId, "Seller ID");
		assertPresent(snapshot.sellerDisplayName, "Seller display name");
		assertPresent(snapshot.name, "Listing name");
		assertPresent(snapshot.brand, "Listing brand");
		assertPresent(snapshot.model, "Listing model");
		assertPresent(snapshot.category, "Listing category");
		assertPresent(snapshot.condition, "Listing condition");
		assertPresent(snapshot.primaryImageUrl, "Listing primary image URL");
		assertSafeNonNegativeInteger(snapshot.stock, "Listing stock");

		this.id = snapshot.id;
		this.sellerId = snapshot.sellerId;
		this.sellerDisplayName = snapshot.sellerDisplayName;
		this.name = snapshot.name;
		this.brand = snapshot.brand;
		this.model = snapshot.model;
		this.category = snapshot.category;
		this.condition = snapshot.condition;
		this.primaryImageUrl = snapshot.primaryImageUrl;
		this.price = snapshot.price;
		this.availableStock = snapshot.stock;
		this.status = snapshot.status;
	}

	static reconstitute(snapshot: ListingSnapshot): Listing {
		return new Listing(snapshot);
	}

	get stock() {
		return this.availableStock;
	}

	isOrderable() {
		return this.status === "APPROVED" && this.availableStock > 0;
	}

	reserveForPurchase(quantity: number): ReservedListingItemSnapshot {
		assertPositiveQuantity(quantity);

		if (this.status !== "APPROVED") {
			throw new ListingPurchaseError(
				"LISTING_NOT_ORDERABLE",
				"Listing must be approved before purchase",
			);
		}

		if (this.availableStock < quantity) {
			throw new ListingPurchaseError(
				"LISTING_INSUFFICIENT_STOCK",
				`Insufficient stock for listing ${this.id}`,
			);
		}

		this.availableStock -= quantity;

		return {
			listingId: this.id,
			listingName: this.name,
			brand: this.brand,
			model: this.model,
			category: this.category,
			condition: this.condition,
			primaryImageUrl: this.primaryImageUrl,
			sellerId: this.sellerId,
			sellerDisplayName: this.sellerDisplayName,
			unitPrice: this.price,
			quantity,
		};
	}
}

function assertPositiveQuantity(quantity: number) {
	if (!Number.isSafeInteger(quantity) || quantity <= 0) {
		throw new ListingPurchaseError(
			"LISTING_INVALID_QUANTITY",
			"Listing purchase quantity must be a positive safe integer",
		);
	}
}

function assertSafeNonNegativeInteger(value: number, label: string) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${label} must be a non-negative safe integer`);
	}
}

function assertPresent(value: string, label: string) {
	if (value.trim().length === 0) {
		throw new Error(`${label} is required`);
	}
}
