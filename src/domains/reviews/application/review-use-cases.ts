import { Review, ReviewDomainError } from "@/domains/reviews/domain/review";
import type {
	ListingReview,
	ListingReviewCreateData,
} from "@/domains/reviews/dto/listing-review";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	type Result,
} from "@/domains/shared/domain/result";

export type {
	ListingReview,
	ListingReviewCreateData,
} from "@/domains/reviews/dto/listing-review";

export type ReviewErrorCode =
	| ReviewDomainError["code"]
	| "REVIEW_ALREADY_EXISTS";

export type ReviewError = AppError<ReviewErrorCode>;

export interface ListingReviewCreatePort {
	createReview(
		data: ListingReviewCreateData,
	): Promise<Result<ListingReview, ReviewError>>;
}

export interface ListingReviewQueryPort {
	listByListingId(listingId: string): Promise<ListingReview[]>;
}

export type ListingReviewPort = ListingReviewCreatePort &
	ListingReviewQueryPort;

export async function createListingReview(
	command: {
		readonly listingId: string;
		readonly rating: number;
		readonly comment: string;
	},
	actor: Actor,
	reviews: ListingReviewCreatePort,
): Promise<Result<ListingReview, ReviewError>> {
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

	return reviews.createReview(review.toCreateData());
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
