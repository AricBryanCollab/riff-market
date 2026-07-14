import { describe, expect, it } from "vitest";
import {
	type CreateListingReviewDependencies,
	type ListingReviewCreatePort,
	type ReviewError,
	reviewAlreadyExistsError,
} from "@/domains/reviews/application/review-use-cases";
import type { Review } from "@/domains/reviews/domain/review";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import type { RequestError } from "@/server/request-error";
import {
	createListingReviewForCurrentUser,
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

const alwaysEligible = {
	async hasDeliveredPurchaseOfListing(): Promise<boolean> {
		return true;
	},
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
		const dependencies: CreateListingReviewDependencies = {
			reviews,
			eligibility: alwaysEligible,
		};

		const response = await createListingReviewForCurrentUser(
			customer,
			{
				listingId,
				rating: 5,
				comment: "Exactly as described.",
			},
			dependencies,
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
		const dependencies: CreateListingReviewDependencies = {
			reviews,
			eligibility: alwaysEligible,
		};

		await expect(
			createListingReviewForCurrentUser(
				customer,
				{
					listingId,
					rating: 5,
					comment: "Exactly as described.",
				},
				dependencies,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 409,
			code: "REVIEW_ALREADY_EXISTS",
		} satisfies Partial<RequestError>);
	});
});

class InMemoryListingReviews implements ListingReviewCreatePort {
	async save(review: Review): Promise<Result<ListingReview, ReviewError>> {
		return ok(makeReview(review));
	}
}

class DuplicateListingReviews implements ListingReviewCreatePort {
	async save(): Promise<Result<ListingReview, ReviewError>> {
		return err(reviewAlreadyExistsError());
	}
}

function makeReview(review: Review): ListingReview {
	return {
		id: "review-1",
		listingId: review.listingId,
		userId: review.userId,
		rating: review.rating,
		comment: review.comment,
		reviewer: {
			firstName: "Pat",
			lastName: "Buyer",
		},
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	};
}
