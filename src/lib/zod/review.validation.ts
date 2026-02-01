import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().min(1, "Comment is required"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
