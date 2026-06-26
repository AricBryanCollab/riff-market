import { describe, expect, it } from "vitest";
import type { Actor } from "@/domains/shared/domain/actor";
import { Money } from "@/domains/shared/domain/money";
import type { ListingSnapshot, ListingStatus } from "../domain/listing";
import {
	type ListingModerationNotifierPort,
	type ListingModerationRepositoryPort,
	type ListingModerationResult,
	type ModerateListingCommand,
	moderateListing,
} from "./moderate-listing";

const admin = { id: "admin-1", role: "ADMIN" } as const;
const seller = { id: "seller-1", role: "SELLER" } as const;

function makeListing(
	overrides: Partial<ListingSnapshot> = {},
): ListingSnapshot {
	return {
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
		status: "PENDING",
		...overrides,
	};
}

function makeSavedListing(status: ListingStatus): ListingModerationResult {
	return {
		id: "listing-1",
		name: "Telecaster",
		sellerId: "seller-1",
		status,
		isApproved: status === "APPROVED",
	};
}

function makePorts(snapshot: ListingSnapshot | null = makeListing()) {
	const lookedUpListingIds: string[] = [];
	const savedStatuses: Array<{
		readonly listingId: string;
		status: ListingStatus;
		expectedStatus: ListingStatus;
	}> = [];
	const notifications: ModerationNotification[] = [];
	const repository: ListingModerationRepositoryPort = {
		findListingForModeration: async (listingId) => {
			lookedUpListingIds.push(listingId);
			return snapshot;
		},
		saveListingStatus: async (listingId, status, expectedStatus) => {
			savedStatuses.push({ listingId, status, expectedStatus });
			return makeSavedListing(status);
		},
	};
	const notifier: ListingModerationNotifierPort = {
		notifyListingApproved: async (listing, event) => {
			notifications.push({
				kind: "approved",
				listing,
				eventName: event.eventName,
				listingId: event.payload.listingId,
				sellerId: event.payload.sellerId,
				actorId: event.metadata?.actor?.id,
			});
		},
		notifyListingDeclined: async (listing, event) => {
			notifications.push({
				kind: "declined",
				listing,
				eventName: event.eventName,
				listingId: event.payload.listingId,
				sellerId: event.payload.sellerId,
				actorId: event.metadata?.actor?.id,
			});
		},
	};

	return {
		lookedUpListingIds,
		moderate: moderateWith(repository, notifier),
		notifications,
		savedStatuses,
	};
}

describe("moderateListing", () => {
	it("approves a pending listing and notifies the seller", async () => {
		const { moderate, notifications, savedStatuses } = makePorts();

		const result = await moderate(admin, {
			listingId: "listing-1",
			decision: "APPROVE",
		});

		expect(result).toEqual({
			ok: true,
			value: makeSavedListing("APPROVED"),
		});
		expect(savedStatuses).toEqual([
			{
				listingId: "listing-1",
				status: "APPROVED",
				expectedStatus: "PENDING",
			},
		]);
		expect(notifications).toEqual([
			{
				kind: "approved",
				listing: makeSavedListing("APPROVED"),
				eventName: "ListingApproved",
				listingId: "listing-1",
				sellerId: "seller-1",
				actorId: "admin-1",
			},
		]);
	});

	it("declines a pending listing without deleting it", async () => {
		const { moderate, notifications, savedStatuses } = makePorts();

		const result = await moderate(admin, {
			listingId: "listing-1",
			decision: "DECLINE",
		});

		expect(result).toEqual({
			ok: true,
			value: makeSavedListing("DECLINED"),
		});
		expect(savedStatuses).toEqual([
			{
				listingId: "listing-1",
				status: "DECLINED",
				expectedStatus: "PENDING",
			},
		]);
		expect(notifications).toEqual([
			{
				kind: "declined",
				listing: makeSavedListing("DECLINED"),
				eventName: "ListingDeclined",
				listingId: "listing-1",
				sellerId: "seller-1",
				actorId: "admin-1",
			},
		]);
	});

	it("requires an admin actor", async () => {
		const { lookedUpListingIds, moderate, notifications, savedStatuses } =
			makePorts();

		const result = await moderate(seller, {
			listingId: "listing-1",
			decision: "APPROVE",
		});

		expect(result).toEqual({
			ok: false,
			error: {
				kind: "authorization",
				code: "MODERATE_LISTING_UNAUTHORIZED",
				message: "Only admins can moderate listings",
			},
		});
		expect(lookedUpListingIds).toEqual([]);
		expect(savedStatuses).toEqual([]);
		expect(notifications).toEqual([]);
	});

	it("returns not found for missing listings", async () => {
		const { lookedUpListingIds, moderate, notifications, savedStatuses } =
			makePorts(null);

		const result = await moderate(admin, {
			listingId: "missing",
			decision: "APPROVE",
		});

		expect(result).toEqual({
			ok: false,
			error: {
				kind: "not-found",
				code: "MODERATE_LISTING_NOT_FOUND",
				message: "Listing not found",
			},
		});
		expect(lookedUpListingIds).toEqual(["missing"]);
		expect(savedStatuses).toEqual([]);
		expect(notifications).toEqual([]);
	});

	it("rejects invalid lifecycle transitions", async () => {
		const { lookedUpListingIds, moderate, notifications, savedStatuses } =
			makePorts(makeListing({ status: "WITHDRAWN" }));

		const result = await moderate(admin, {
			listingId: "listing-1",
			decision: "APPROVE",
		});

		expect(result).toEqual({
			ok: false,
			error: {
				kind: "conflict",
				code: "MODERATE_LISTING_INVALID_TRANSITION",
				message: "Withdrawn listings cannot be approved",
				details: { code: "LISTING_WITHDRAWN_CANNOT_BE_APPROVED" },
			},
		});
		expect(lookedUpListingIds).toEqual(["listing-1"]);
		expect(savedStatuses).toEqual([]);
		expect(notifications).toEqual([]);
	});

	it("returns a conflict when persistence does not confirm the expected status", async () => {
		const savedStatuses: Array<{
			readonly listingId: string;
			status: ListingStatus;
			expectedStatus: ListingStatus;
		}> = [];
		let notified = false;
		const repository: ListingModerationRepositoryPort = {
			findListingForModeration: async () => makeListing(),
			saveListingStatus: async (listingId, status, expectedStatus) => {
				savedStatuses.push({ listingId, status, expectedStatus });
				return null;
			},
		};
		const notifier: ListingModerationNotifierPort = {
			notifyListingApproved: async () => {
				notified = true;
			},
			notifyListingDeclined: async () => {
				notified = true;
			},
		};

		const result = await moderateListing(
			admin,
			{
				listingId: "listing-1",
				decision: "APPROVE",
			},
			repository,
			notifier,
		);

		expect(result).toEqual({
			ok: false,
			error: {
				kind: "conflict",
				code: "MODERATE_LISTING_STALE_STATUS",
				message: "Listing status changed before moderation completed",
			},
		});
		expect(savedStatuses).toEqual([
			{
				listingId: "listing-1",
				status: "APPROVED",
				expectedStatus: "PENDING",
			},
		]);
		expect(notified).toBe(false);
	});
});

function moderateWith(
	repository: ListingModerationRepositoryPort,
	notifier: ListingModerationNotifierPort,
) {
	return (actor: Actor, command: ModerateListingCommand) =>
		moderateListing(actor, command, repository, notifier);
}

type ModerationNotification = {
	readonly kind: "approved" | "declined";
	readonly listing: ListingModerationResult;
	readonly eventName: "ListingApproved" | "ListingDeclined";
	readonly listingId: string;
	readonly sellerId: string;
	readonly actorId: string | undefined;
};
