import { describe, expect, it } from "vitest";
import { Review, ReviewDomainError } from "./review";

describe("Review", () => {
	it("accepts and normalizes listing review input", () => {
		const review = Review.create({
			listingId: " listing-1 ",
			userId: " customer-1 ",
			rating: 5,
			comment: " Exactly as described. ",
		});

		expect(review).toEqual({
			listingId: "listing-1",
			userId: "customer-1",
			rating: 5,
			comment: "Exactly as described.",
		});
	});

	it.each([
		0, 6, 4.5,
	])("rejects %s-star ratings outside the listing review scale", (rating) => {
		expect(() =>
			Review.create({
				listingId: "listing-1",
				userId: "customer-1",
				rating,
				comment: "Exactly as described.",
			}),
		).toThrow(
			new ReviewDomainError(
				"REVIEW_INVALID_RATING",
				"Rating must be between 1 and 5",
			),
		);
	});

	it.each([
		{
			data: {
				listingId: " ",
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
			},
			error: new ReviewDomainError(
				"REVIEW_INVALID_LISTING_ID",
				"Listing ID is required",
			),
		},
		{
			data: {
				listingId: "listing-1",
				userId: " ",
				rating: 5,
				comment: "Exactly as described.",
			},
			error: new ReviewDomainError(
				"REVIEW_UNAUTHENTICATED",
				"User must be logged in to review",
			),
		},
		{
			data: {
				listingId: "listing-1",
				userId: "customer-1",
				rating: 5,
				comment: " ",
			},
			error: new ReviewDomainError(
				"REVIEW_COMMENT_REQUIRED",
				"Comment is required",
			),
		},
	])("rejects invalid review input %#", ({ data, error }) => {
		expect(() => Review.create(data)).toThrow(error);
	});
});
