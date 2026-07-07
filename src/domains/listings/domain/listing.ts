import type { Actor } from "@/domains/shared/domain/actor";
import {
	createDomainEvent,
	type DomainEvent,
	type RecordsDomainEvents,
} from "@/domains/shared/domain/domain-event";
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

export type ListingLifecycleErrorCode =
	| "LISTING_ALREADY_APPROVED"
	| "LISTING_ALREADY_DECLINED"
	| "LISTING_ALREADY_WITHDRAWN"
	| "LISTING_WITHDRAWN_CANNOT_BE_APPROVED"
	| "LISTING_WITHDRAWN_CANNOT_BE_DECLINED";

export type ListingLifecycleEvent =
	| DomainEvent<
			"ListingApproved",
			{ readonly listingId: string; readonly sellerId: string }
	  >
	| DomainEvent<
			"ListingDeclined",
			{ readonly listingId: string; readonly sellerId: string }
	  >
	| DomainEvent<
			"ListingWithdrawn",
			{ readonly listingId: string; readonly sellerId: string }
	  >;

export function canApproveListingStatus(status: ListingStatus) {
	return status !== "APPROVED" && status !== "WITHDRAWN";
}

export function canDeclineListingStatus(status: ListingStatus) {
	return status !== "DECLINED" && status !== "WITHDRAWN";
}

export function isListingOrderable(status: ListingStatus, stock: number) {
	return status === "APPROVED" && stock > 0;
}

export class ListingPurchaseError extends Error {
	readonly code: ListingPurchaseErrorCode;

	constructor(code: ListingPurchaseErrorCode, message: string) {
		super(message);
		this.name = "ListingPurchaseError";
		this.code = code;
	}
}

export class ListingLifecycleError extends Error {
	readonly code: ListingLifecycleErrorCode;

	constructor(code: ListingLifecycleErrorCode, message: string) {
		super(message);
		this.name = "ListingLifecycleError";
		this.code = code;
	}
}

export class Listing implements RecordsDomainEvents {
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

	private availableStock: number;
	private currentStatus: ListingStatus;
	private domainEvents: ListingLifecycleEvent[] = [];

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
		this.currentStatus = snapshot.status;
	}

	static reconstitute(snapshot: ListingSnapshot): Listing {
		return new Listing(snapshot);
	}

	get stock() {
		return this.availableStock;
	}

	get status() {
		return this.currentStatus;
	}

	isOrderable() {
		return isListingOrderable(this.currentStatus, this.availableStock);
	}

	approve(actor: Actor) {
		if (!canApproveListingStatus(this.currentStatus)) {
			if (this.currentStatus === "WITHDRAWN") {
				throw new ListingLifecycleError(
					"LISTING_WITHDRAWN_CANNOT_BE_APPROVED",
					"Withdrawn listings cannot be approved",
				);
			}

			throw new ListingLifecycleError(
				"LISTING_ALREADY_APPROVED",
				"Listing is already approved",
			);
		}

		this.currentStatus = "APPROVED";
		this.recordLifecycleEvent("ListingApproved", actor);
	}

	decline(actor: Actor) {
		if (!canDeclineListingStatus(this.currentStatus)) {
			if (this.currentStatus === "WITHDRAWN") {
				throw new ListingLifecycleError(
					"LISTING_WITHDRAWN_CANNOT_BE_DECLINED",
					"Withdrawn listings cannot be declined",
				);
			}

			throw new ListingLifecycleError(
				"LISTING_ALREADY_DECLINED",
				"Listing is already declined",
			);
		}

		this.currentStatus = "DECLINED";
		this.recordLifecycleEvent("ListingDeclined", actor);
	}

	withdraw(actor: Actor) {
		if (this.currentStatus === "WITHDRAWN") {
			throw new ListingLifecycleError(
				"LISTING_ALREADY_WITHDRAWN",
				"Listing is already withdrawn",
			);
		}

		this.currentStatus = "WITHDRAWN";
		this.recordLifecycleEvent("ListingWithdrawn", actor);
	}

	pullDomainEvents(): ListingLifecycleEvent[] {
		const events = this.domainEvents;
		this.domainEvents = [];
		return events;
	}

	reserveForPurchase(quantity: number): ReservedListingItemSnapshot {
		assertPositiveQuantity(quantity);

		if (this.currentStatus !== "APPROVED") {
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

	private recordLifecycleEvent(
		eventName: ListingLifecycleEvent["eventName"],
		actor: Actor,
	) {
		this.domainEvents.push(
			createDomainEvent({
				eventName,
				aggregateId: this.id,
				payload: {
					listingId: this.id,
					sellerId: this.sellerId,
				},
				metadata: { actor },
			}) as ListingLifecycleEvent,
		);
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
