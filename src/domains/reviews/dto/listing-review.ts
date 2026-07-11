import { z } from "zod";

export interface ListingReview {
	readonly id: string;
	readonly listingId: string;
	readonly userId: string;
	readonly rating: number;
	readonly comment: string;
	readonly reviewer: {
		readonly firstName: string;
		readonly lastName: string;
	};
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export const createListingReviewSchema = z.object({
	listingId: z.string().trim().uuid("Invalid listing ID"),
	rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
	comment: z.string().trim().min(1, "Comment is required"),
});

export type CreateListingReviewInput = z.infer<
	typeof createListingReviewSchema
>;

export const getListingReviewsQuerySchema = z.object({
	listingId: z.string().trim().uuid("Invalid listing ID"),
});

export type GetListingReviewsQuery = z.infer<
	typeof getListingReviewsQuerySchema
>;
