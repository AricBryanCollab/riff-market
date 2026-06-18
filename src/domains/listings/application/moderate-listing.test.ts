import { describe, expect, it } from "vitest";
import { Money } from "@/domains/shared/domain/money";
import type { ListingSnapshot, ListingStatus } from "../domain/listing";
import {
	type ListingModerationNotifierPort,
	type ListingModerationRepositoryPort,
	type ListingModerationResult,
	ModerateListing,
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
	const calls: string[] = [];
	const repository: ListingModerationRepositoryPort = {
		findListingForModeration: async (listingId) => {
			calls.push(`find:${listingId}`);
			return snapshot;
		},
		saveListingStatus: async (listingId, status) => {
			calls.push(`save:${listingId}:${status}`);
			return makeSavedListing(status);
		},
	};
	const notifier: ListingModerationNotifierPort = {
		notifyListingApproved: async (listing) => {
			calls.push(`approved:${listing.id}`);
		},
		notifyListingDeclined: async (listing) => {
			calls.push(`declined:${listing.id}`);
		},
	};

	return {
		calls,
		useCase: new ModerateListing(repository, notifier),
	};
}

describe("ModerateListing", () => {
	it("approves a pending listing and notifies the seller", async () => {
		const { calls, useCase } = makePorts();

		const result = await useCase.execute(admin, {
			listingId: "listing-1",
			decision: "APPROVE",
		});

		expect(result).toEqual({
			ok: true,
			value: makeSavedListing("APPROVED"),
		});
		expect(calls).toEqual([
			"find:listing-1",
			"save:listing-1:APPROVED",
			"approved:listing-1",
		]);
	});

	it("declines a pending listing without deleting it", async () => {
		const { calls, useCase } = makePorts();

		const result = await useCase.execute(admin, {
			listingId: "listing-1",
			decision: "DECLINE",
		});

		expect(result).toEqual({
			ok: true,
			value: makeSavedListing("DECLINED"),
		});
		expect(calls).toEqual([
			"find:listing-1",
			"save:listing-1:DECLINED",
			"declined:listing-1",
		]);
	});

	it("requires an admin actor", async () => {
		const { calls, useCase } = makePorts();

		const result = await useCase.execute(seller, {
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
		expect(calls).toEqual([]);
	});

	it("returns not found for missing listings", async () => {
		const { calls, useCase } = makePorts(null);

		const result = await useCase.execute(admin, {
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
		expect(calls).toEqual(["find:missing"]);
	});

	it("rejects invalid lifecycle transitions", async () => {
		const { calls, useCase } = makePorts(makeListing({ status: "WITHDRAWN" }));

		const result = await useCase.execute(admin, {
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
		expect(calls).toEqual(["find:listing-1"]);
	});

	it("returns a save failure when persistence does not confirm the status", async () => {
		const calls: string[] = [];
		const repository: ListingModerationRepositoryPort = {
			findListingForModeration: async () => makeListing(),
			saveListingStatus: async (listingId, status) => {
				calls.push(`save:${listingId}:${status}`);
				return null;
			},
		};
		const notifier: ListingModerationNotifierPort = {
			notifyListingApproved: async () => {
				calls.push("approved");
			},
			notifyListingDeclined: async () => {
				calls.push("declined");
			},
		};

		const result = await new ModerateListing(repository, notifier).execute(
			admin,
			{
				listingId: "listing-1",
				decision: "APPROVE",
			},
		);

		expect(result).toEqual({
			ok: false,
			error: {
				kind: "unexpected",
				code: "MODERATE_LISTING_SAVE_FAILED",
				message: "Failed to save listing moderation result",
			},
		});
		expect(calls).toEqual(["save:listing-1:APPROVED"]);
	});
});
