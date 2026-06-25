import type { ListingReviewCreateData } from "@/domains/reviews/dto/listing-review";

export type ReviewDomainErrorCode =
	| "REVIEW_UNAUTHENTICATED"
	| "REVIEW_INVALID_LISTING_ID"
	| "REVIEW_INVALID_RATING"
	| "REVIEW_COMMENT_REQUIRED";

export class ReviewDomainError extends Error {
	readonly code: ReviewDomainErrorCode;

	constructor(code: ReviewDomainErrorCode, message: string) {
		super(message);
		this.name = "ReviewDomainError";
		this.code = code;
	}
}

export class Review {
	private constructor(private readonly data: ListingReviewCreateData) {}

	static create(data: ListingReviewCreateData): Review {
		const listingId = data.listingId.trim();
		const userId = data.userId.trim();
		const comment = data.comment.trim();

		if (listingId.length === 0) {
			throw new ReviewDomainError(
				"REVIEW_INVALID_LISTING_ID",
				"Listing ID is required",
			);
		}

		if (userId.length === 0) {
			throw new ReviewDomainError(
				"REVIEW_UNAUTHENTICATED",
				"User must be logged in to review",
			);
		}

		if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
			throw new ReviewDomainError(
				"REVIEW_INVALID_RATING",
				"Rating must be between 1 and 5",
			);
		}

		if (comment.length === 0) {
			throw new ReviewDomainError(
				"REVIEW_COMMENT_REQUIRED",
				"Comment is required",
			);
		}

		return new Review({
			listingId,
			userId,
			rating: data.rating,
			comment,
		});
	}

	toCreateData(): ListingReviewCreateData {
		return this.data;
	}
}
