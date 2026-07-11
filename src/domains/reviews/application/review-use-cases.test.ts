import { describe, expect, it } from "vitest";
import type { Actor } from "@/domains/shared/domain/actor";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import {
	createListingReview,
	type ListingReview,
	type ListingReviewCreateData,
	type ListingReviewPort,
	type ReviewError,
	reviewAlreadyExistsError,
} from "./review-use-cases";

describe("review use cases", () => {
	it("creates a listing review", async () => {
		const reviews = new InMemoryListingReviews();
		const actor: Actor = { id: "customer-1", role: "CUSTOMER" };

		const created = await createListingReview(
			{
				listingId: " listing-1 ",
				rating: 5,
				comment: " Exactly as described. ",
			},
			actor,
			reviews,
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

	it("rejects invalid create commands before persistence", async () => {
		const reviews = new InMemoryListingReviews();

		await expect(
			createListingReview(
				{
					listingId: "",
					rating: 5,
					comment: "Valid comment.",
				},
				{ id: "customer-1", role: "CUSTOMER" },
				reviews,
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
				{
					listingId: "listing-1",
					rating: 6,
					comment: "Too many stars.",
				},
				{ id: "customer-1", role: "CUSTOMER" },
				reviews,
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

	it("maps duplicate reviews through the review port", async () => {
		const reviews = new InMemoryListingReviews();
		const actor: Actor = { id: "customer-1", role: "CUSTOMER" };

		await expect(
			createListingReview(
				{
					listingId: "listing-1",
					rating: 5,
					comment: "First review.",
				},
				actor,
				reviews,
			),
		).resolves.toMatchObject({ ok: true });

		const duplicate = await createListingReview(
			{
				listingId: "listing-1",
				rating: 4,
				comment: "Changed my mind.",
			},
			actor,
			reviews,
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

	async createReview(
		data: ListingReviewCreateData,
	): Promise<Result<ListingReview, ReviewError>> {
		if (
			this.reviews.some(
				(review) =>
					review.listingId === data.listingId && review.userId === data.userId,
			)
		) {
			return err(reviewAlreadyExistsError());
		}

		const review = {
			id: `review-${this.nextId}`,
			listingId: data.listingId,
			userId: data.userId,
			rating: data.rating,
			comment: data.comment,
			reviewer: {
				firstName: `Customer ${this.nextId}`,
				lastName: "Reviewer",
			},
			createdAt: new Date(`2026-01-0${this.nextId}T00:00:00.000Z`),
			updatedAt: new Date(`2026-01-0${this.nextId}T00:00:00.000Z`),
		};

		this.nextId += 1;
		this.reviews.push(review);
		return ok(review);
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
