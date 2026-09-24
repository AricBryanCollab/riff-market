import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import { queryKeys } from "@/lib/tanstack-query/query-keys";
import { listListingReviewsFn } from "@/server/review.functions";

export const listingReviewsQueryOpt = (listingId: string) =>
	queryOptions<ListingReview[]>({
		queryKey: queryKeys.reviews.byListing(listingId),
		queryFn: async () => listListingReviewsFn({ data: { listingId } }),
		staleTime: 1000 * 60,
	});

export type ListingReviewSummary = {
	readonly reviewCount: number;
	readonly averageRating: number;
	readonly distribution: readonly { stars: number; count: number }[];
};

export function summarizeListingReviews(
	reviews: readonly ListingReview[],
): ListingReviewSummary {
	const reviewCount = reviews.length;
	const total = reviews.reduce((sum, review) => sum + review.rating, 0);

	return {
		reviewCount,
		averageRating: reviewCount > 0 ? total / reviewCount : 0,
		distribution: [5, 4, 3, 2, 1].map((stars) => ({
			stars,
			count: reviews.filter((review) => review.rating === stars).length,
		})),
	};
}

export const useListingReviews = (listingId: string) => {
	const query = useQuery(listingReviewsQueryOpt(listingId));

	return {
		...query,
		reviews: query.data ?? [],
		summary: summarizeListingReviews(query.data ?? []),
	};
};
