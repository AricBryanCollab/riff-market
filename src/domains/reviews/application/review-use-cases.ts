import { Review, ReviewDomainError } from "@/domains/reviews/domain/review";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	type Result,
} from "@/domains/shared/domain/result";

export type ReviewErrorCode =
	| ReviewDomainError["code"]
	| "REVIEW_ALREADY_EXISTS"
	| "REVIEW_UNAUTHORIZED"
	| "REVIEW_NOT_ELIGIBLE";

export type ReviewError = AppError<ReviewErrorCode>;

export interface ListingReviewCreatePort {
	save(review: Review): Promise<Result<ListingReview, ReviewError>>;
}

export interface ListingReviewQueryPort {
	listByListingId(listingId: string): Promise<ListingReview[]>;
}

export type ListingReviewPort = ListingReviewCreatePort &
	ListingReviewQueryPort;

export interface ListingReviewEligibilityPort {
	hasDeliveredPurchaseOfListing(
		customerId: string,
		listingId: string,
	): Promise<boolean>;
}

export type CreateListingReviewDependencies = {
	readonly reviews: ListingReviewCreatePort;
	readonly eligibility: ListingReviewEligibilityPort;
};

export async function createListingReview(
	actor: Actor,
	command: {
		readonly listingId: string;
		readonly rating: number;
		readonly comment: string;
	},
	dependencies: CreateListingReviewDependencies,
): Promise<Result<ListingReview, ReviewError>> {
	if (actor.role !== "CUSTOMER") {
		return err(
			reviewError(
				"REVIEW_UNAUTHORIZED",
				"Only customers can create listing reviews",
				"authorization",
			),
		);
	}

	const { reviews, eligibility } = dependencies;
	let review: Review;

	try {
		review = Review.create({
			listingId: command.listingId,
			userId: actor.id,
			rating: command.rating,
			comment: command.comment,
		});
	} catch (error) {
		if (error instanceof ReviewDomainError) {
			return err(reviewDomainError(error));
		}

		throw error;
	}

	const isEligible = await eligibility.hasDeliveredPurchaseOfListing(
		review.userId,
		review.listingId,
	);

	if (!isEligible) {
		return err(
			reviewError(
				"REVIEW_NOT_ELIGIBLE",
				"Only customers with a delivered purchase of this listing can leave a review",
				"authorization",
			),
		);
	}

	return reviews.save(review);
}

export function reviewAlreadyExistsError(): ReviewError {
	return reviewError(
		"REVIEW_ALREADY_EXISTS",
		"User has already reviewed this listing",
		"conflict",
	);
}

function reviewDomainError(error: ReviewDomainError): ReviewError {
	return reviewError(
		error.code,
		error.message,
		error.code === "REVIEW_UNAUTHENTICATED" ? "authorization" : "validation",
	);
}

function reviewError(
	code: ReviewErrorCode,
	message: string,
	kind: ReviewError["kind"],
): ReviewError {
	return {
		code,
		message,
		kind,
	};
}
