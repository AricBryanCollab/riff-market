import { describe, expect, it } from "vitest";
import type {
	ListingReview,
	ListingReviewCreateData,
	ListingReviewPort,
	ReviewError,
} from "@/domains/reviews/application/review-use-cases";
import { reviewAlreadyExistsError } from "@/domains/reviews/application/review-use-cases";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	createListingReviewForCurrentUser,
	type ReviewRequestError,
	validateCreateListingReviewInput,
	validateGetListingReviewsInput,
} from "@/server/review-service";

const listingId = "11111111-1111-4111-8111-111111111111";

const customer: ServerUserContext = {
	id: "customer-1",
	email: "pat@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

describe("review server service", () => {
	it("validates and trims review inputs", () => {
		expect(
			validateCreateListingReviewInput({
				listingId: ` ${listingId} `,
				rating: 5,
				comment: " Exactly as described. ",
			}),
		).toEqual({
			listingId,
			rating: 5,
			comment: "Exactly as described.",
		});

		expect(
			validateGetListingReviewsInput({ listingId: ` ${listingId} ` }),
		).toEqual({
			listingId,
		});
	});

	it("creates a review for the current user", async () => {
		const reviews = new InMemoryListingReviews();

		const response = await createListingReviewForCurrentUser(
			customer,
			{
				listingId,
				rating: 5,
				comment: "Exactly as described.",
			},
			reviews,
		);

		expect(response).toMatchObject({
			message: "Review created successfully",
			review: {
				listingId,
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
			},
		});
	});

	it("maps duplicate review conflicts to request errors", async () => {
		const reviews = new DuplicateListingReviews();

		await expect(
			createListingReviewForCurrentUser(
				customer,
				{
					listingId,
					rating: 5,
					comment: "Exactly as described.",
				},
				reviews,
			),
		).rejects.toMatchObject({
			name: "ReviewRequestError",
			status: 409,
			code: "REVIEW_ALREADY_EXISTS",
		} satisfies Partial<ReviewRequestError>);
	});
});

class InMemoryListingReviews implements ListingReviewPort {
	async createReview(
		data: ListingReviewCreateData,
	): Promise<Result<ListingReview, ReviewError>> {
		return ok(makeReview(data));
	}

	async listByListingId(): Promise<ListingReview[]> {
		return [];
	}
}

class DuplicateListingReviews implements ListingReviewPort {
	async createReview(): Promise<Result<ListingReview, ReviewError>> {
		return err(reviewAlreadyExistsError());
	}

	async listByListingId(): Promise<ListingReview[]> {
		return [];
	}
}

function makeReview(data: ListingReviewCreateData): ListingReview {
	return {
		id: "review-1",
		listingId: data.listingId,
		userId: data.userId,
		rating: data.rating,
		comment: data.comment,
		reviewer: {
			firstName: "Pat",
			lastName: "Buyer",
		},
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	};
}
