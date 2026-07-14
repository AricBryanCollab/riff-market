import { describe, expect, it } from "vitest";
import type { Review } from "@/domains/reviews/domain/review";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import type { Actor } from "@/domains/shared/domain/actor";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import {
	createListingReview,
	type ListingReviewEligibilityPort,
	type ListingReviewPort,
	type ReviewError,
	reviewAlreadyExistsError,
} from "./review-use-cases";

describe("review use cases", () => {
	it("creates a listing review when the customer has a delivered purchase", async () => {
		const reviews = new InMemoryListingReviews();
		const eligibility = new InMemoryListingReviewEligibility({
			"customer-1:listing-1": true,
		});
		const actor: Actor = { id: "customer-1", role: "CUSTOMER" };

		const created = await createListingReview(
			actor,
			{
				listingId: " listing-1 ",
				rating: 5,
				comment: " Exactly as described. ",
			},
			{ reviews, eligibility },
		);

		expect(created).toMatchObject({
			ok: true,
			value: {
				listingId: "listing-1",
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
			},
		});
	});

	it("rejects non-customers without creating a review", async () => {
		const reviews = new InMemoryListingReviews();
		const eligibility = new InMemoryListingReviewEligibility({
			"seller-1:listing-1": true,
		});

		const rejected = await createListingReview(
			{ id: "seller-1", role: "SELLER" },
			{
				listingId: "listing-1",
				rating: 5,
				comment: "I sell this gear.",
			},
			{ reviews, eligibility },
		);

		expect(rejected).toEqual({
			ok: false,
			error: {
				code: "REVIEW_UNAUTHORIZED",
				message: "Only customers can create listing reviews",
				kind: "authorization",
			},
		});
		await expect(reviews.listByListingId("listing-1")).resolves.toEqual([]);
	});

	it("rejects customers without a delivered purchase of the listing", async () => {
		const reviews = new InMemoryListingReviews();
		const eligibility = new InMemoryListingReviewEligibility({});

		const rejected = await createListingReview(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				listingId: "listing-1",
				rating: 5,
				comment: "Looks great in photos.",
			},
			{ reviews, eligibility },
		);

		expect(rejected).toEqual({
			ok: false,
			error: {
				code: "REVIEW_NOT_ELIGIBLE",
				message:
					"Only customers with a delivered purchase of this listing can leave a review",
				kind: "authorization",
			},
		});
		await expect(reviews.listByListingId("listing-1")).resolves.toEqual([]);
	});

	it("rejects create commands with invalid listing id or rating", async () => {
		const reviews = new InMemoryListingReviews();
		const eligibility = new InMemoryListingReviewEligibility({
			"customer-1:listing-1": true,
		});
		const dependencies = { reviews, eligibility };

		await expect(
			createListingReview(
				{ id: "customer-1", role: "CUSTOMER" },
				{
					listingId: "",
					rating: 5,
					comment: "Valid comment.",
				},
				dependencies,
			),
		).resolves.toEqual({
			ok: false,
			error: {
				code: "REVIEW_INVALID_LISTING_ID",
				message: "Listing ID is required",
				kind: "validation",
			},
		});

		await expect(
			createListingReview(
				{ id: "customer-1", role: "CUSTOMER" },
				{
					listingId: "listing-1",
					rating: 6,
					comment: "Too many stars.",
				},
				dependencies,
			),
		).resolves.toEqual({
			ok: false,
			error: {
				code: "REVIEW_INVALID_RATING",
				message: "Rating must be between 1 and 5",
				kind: "validation",
			},
		});

		await expect(reviews.listByListingId("listing-1")).resolves.toEqual([]);
	});

	it("rejects a second review from the same customer for a listing", async () => {
		const reviews = new InMemoryListingReviews();
		const eligibility = new InMemoryListingReviewEligibility({
			"customer-1:listing-1": true,
		});
		const actor: Actor = { id: "customer-1", role: "CUSTOMER" };
		const dependencies = { reviews, eligibility };

		await expect(
			createListingReview(
				actor,
				{
					listingId: "listing-1",
					rating: 5,
					comment: "First review.",
				},
				dependencies,
			),
		).resolves.toMatchObject({ ok: true });

		const duplicate = await createListingReview(
			actor,
			{
				listingId: "listing-1",
				rating: 4,
				comment: "Changed my mind.",
			},
			dependencies,
		);

		expect(duplicate).toEqual({
			ok: false,
			error: {
				code: "REVIEW_ALREADY_EXISTS",
				message: "User has already reviewed this listing",
				kind: "conflict",
			},
		});
	});
});

class InMemoryListingReviews implements ListingReviewPort {
	private nextId = 1;
	private readonly reviews: ListingReview[] = [];

	async save(review: Review): Promise<Result<ListingReview, ReviewError>> {
		if (
			this.reviews.some(
				(existing) =>
					existing.listingId === review.listingId &&
					existing.userId === review.userId,
			)
		) {
			return err(reviewAlreadyExistsError());
		}

		const saved = {
			id: `review-${this.nextId}`,
			listingId: review.listingId,
			userId: review.userId,
			rating: review.rating,
			comment: review.comment,
			reviewer: {
				firstName: `Customer ${this.nextId}`,
				lastName: "Reviewer",
			},
			createdAt: new Date(`2026-01-0${this.nextId}T00:00:00.000Z`),
			updatedAt: new Date(`2026-01-0${this.nextId}T00:00:00.000Z`),
		};

		this.nextId += 1;
		this.reviews.push(saved);
		return ok(saved);
	}

	async listByListingId(listingId: string): Promise<ListingReview[]> {
		return this.reviews
			.filter((review) => review.listingId === listingId)
			.slice()
			.sort(
				(left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
			);
	}
}

class InMemoryListingReviewEligibility implements ListingReviewEligibilityPort {
	constructor(private readonly delivered: Record<string, boolean>) {}

	async hasDeliveredPurchaseOfListing(
		customerId: string,
		listingId: string,
	): Promise<boolean> {
		return this.delivered[`${customerId}:${listingId}`] === true;
	}
}
