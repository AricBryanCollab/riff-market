import type { Prisma, PrismaClient } from "generated/prisma/client";
import type {
	ListingReviewPort,
	ReviewError,
} from "@/domains/reviews/application/review-use-cases";
import { reviewAlreadyExistsError } from "@/domains/reviews/application/review-use-cases";
import type { Review } from "@/domains/reviews/domain/review";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import { err, ok, type Result } from "@/domains/shared/domain/result";
import { isPrismaUniqueConflict } from "@/domains/shared/infrastructure/prisma-errors";

type ReviewPrisma = Pick<PrismaClient, "review">;

const listingReviewSelect = {
	id: true,
	listingId: true,
	userId: true,
	rating: true,
	comment: true,
	createdAt: true,
	updatedAt: true,
	user: {
		select: {
			firstName: true,
			lastName: true,
		},
	},
} satisfies Prisma.ReviewSelect;

type ListingReviewRow = Prisma.ReviewGetPayload<{
	select: typeof listingReviewSelect;
}>;

export class PrismaListingReviews implements ListingReviewPort {
	constructor(private readonly db: ReviewPrisma) {}

	async save(review: Review): Promise<Result<ListingReview, ReviewError>> {
		try {
			const saved = await this.db.review.create({
				data: {
					listingId: review.listingId,
					userId: review.userId,
					rating: review.rating,
					comment: review.comment,
				},
				select: listingReviewSelect,
			});

			return ok(toListingReview(saved));
		} catch (error) {
			if (isUniqueReviewConflict(error)) {
				return err(reviewAlreadyExistsError());
			}

			throw error;
		}
	}

	async listByListingId(listingId: string): Promise<ListingReview[]> {
		const reviews = await this.db.review.findMany({
			where: { listingId },
			select: listingReviewSelect,
			orderBy: { createdAt: "desc" },
		});

		return reviews.map(toListingReview);
	}
}

function toListingReview(review: ListingReviewRow): ListingReview {
	return {
		id: review.id,
		listingId: review.listingId,
		userId: review.userId,
		rating: review.rating,
		comment: review.comment,
		reviewer: {
			firstName: review.user.firstName,
			lastName: review.user.lastName,
		},
		createdAt: review.createdAt,
		updatedAt: review.updatedAt,
	};
}

function isUniqueReviewConflict(error: unknown) {
	return isPrismaUniqueConflict(error, ["listingId"]);
}
