import { createReview, getReviewById, getReviewsByProductId } from "@/data/review-repo";
import {
  type CreateReviewInput,
  createReviewSchema,
  getReviewsQuerySchema,
} from "@/lib/zod/review-validation";

export async function createReviewService(
  userId: string,
  _authRole: string,
  rawData: CreateReviewInput,
) {
  const parsed = createReviewSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Invalid data to create review",
      details: parsed.error,
    };
  }

  const data = parsed.data;

  if (!userId) {
    return { error: "Unauthorized, user must be logged in" };
  }

  const reviewData = {
    userId: userId,
    productId: data.productId,
    rating: data.rating,
    comment: data.comment
  };

  const newReview = await createReview(reviewData);

  return newReview;
}

export async function getReviewByIdService(reviewId: string) {
  const review = await getReviewById(reviewId);

  if (!review) {
    return { error: "Review not found" };
  }

  return review;
}

export async function getReviewsByProductService(rawQuery: unknown) {
  const parsed = getReviewsQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return {
      error: "Invalid review queries",
      details: parsed.error,
    };
  }

  const validQuery = parsed.data;

  if (!validQuery.productId) {
    return {
      error: "productId is required",
    };
  }

  const reviews = await getReviewsByProductId(validQuery.productId);

  return reviews;
}
