import { createReview } from "@/data/review.repo.ts";
import {
  type CreateReviewInput,
  createReviewSchema
} from "@/lib/zod/review.validation";

export async function createReviewService(
  userId: string,
  authRole: string,
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
  const isAdmin = authRole === "ADMIN";
  const isUser = authRole === "USER";

  if ((!isAdmin && !isUser) || !userId) {
    return { error: "Unauthorized, user must be a user" };
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


