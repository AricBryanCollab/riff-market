import type { Actor } from "@/domains/shared/domain/actor";
import {
	createDomainEvent,
	type DomainEvent,
	type RecordsDomainEvents,
} from "@/domains/shared/domain/domain-event";
import type { Money } from "@/domains/shared/domain/money";
import { normalizeListingBrand } from "./listing-brand";

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
	readonly description?: string;
	readonly primaryImageUrl: string;
	readonly price: Money;
	readonly stock: number;
	readonly status: ListingStatus;
};

export type ListingEditInput = {
	readonly name?: string;
	readonly brand?: string;
	readonly model?: string;
	readonly category?: string;
	readonly condition?: string;
	readonly description?: string;
	readonly price?: Money;
	readonly stock?: number;
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

	private listingName: string;
	private listingBrand: string;
	private listingModel: string;
	private listingCategory: string;
	private listingCondition: string;
	private listingDescription: string;
	private listingPrimaryImageUrl: string;
	private listingPrice: Money;
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
		this.listingName = snapshot.name;
		this.listingBrand = snapshot.brand;
		this.listingModel = snapshot.model;
		this.listingCategory = snapshot.category;
		this.listingCondition = snapshot.condition;
		this.listingDescription = snapshot.description ?? "";
		this.listingPrimaryImageUrl = snapshot.primaryImageUrl;
		this.listingPrice = snapshot.price;
		this.availableStock = snapshot.stock;
		this.currentStatus = snapshot.status;
	}

	static fromExisting(snapshot: ListingSnapshot): Listing {
		return new Listing(snapshot);
	}

	get name() {
		return this.listingName;
	}

	get brand() {
		return this.listingBrand;
	}

	get model() {
		return this.listingModel;
	}

	get category() {
		return this.listingCategory;
	}

	get condition() {
		return this.listingCondition;
	}

	get description() {
		return this.listingDescription;
	}

	get primaryImageUrl() {
		return this.listingPrimaryImageUrl;
	}

	get price() {
		return this.listingPrice;
	}

	get stock() {
		return this.availableStock;
	}

	get status() {
		return this.currentStatus;
	}

	get isApproved() {
		return this.currentStatus === "APPROVED";
	}

	applyEdit(actor: Actor, edit: ListingEditInput = {}) {
		if (edit.name !== undefined) {
			assertPresent(edit.name, "Listing name");
			this.listingName = edit.name;
		}

		if (edit.brand !== undefined) {
			this.listingBrand = normalizeListingBrand(edit.brand);
			assertPresent(this.listingBrand, "Listing brand");
		}

		if (edit.model !== undefined) {
			assertPresent(edit.model, "Listing model");
			this.listingModel = edit.model;
		}

		if (edit.category !== undefined) {
			assertPresent(edit.category, "Listing category");
			this.listingCategory = edit.category;
		}

		if (edit.condition !== undefined) {
			assertPresent(edit.condition, "Listing condition");
			this.listingCondition = edit.condition;
		}

		if (edit.description !== undefined) {
			assertPresent(edit.description, "Listing description");
			this.listingDescription = edit.description.trim();
		}

		if (edit.price !== undefined) {
			this.listingPrice = edit.price;
		}

		if (edit.stock !== undefined) {
			assertSafeNonNegativeInteger(edit.stock, "Listing stock");
			this.availableStock = edit.stock;
		}

		this.currentStatus = actor.role === "ADMIN" ? "APPROVED" : "PENDING";
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
			listingName: this.listingName,
			brand: this.listingBrand,
			model: this.listingModel,
			category: this.listingCategory,
			condition: this.listingCondition,
			primaryImageUrl: this.listingPrimaryImageUrl,
			sellerId: this.sellerId,
			sellerDisplayName: this.sellerDisplayName,
			unitPrice: this.listingPrice,
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
