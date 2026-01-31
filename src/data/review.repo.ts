import { Review } from "generated/prisma/client";
import { prisma } from "@/data/connectDb";

type CreateReviewRepoInput = Omit<
  Review,
  "id" | "createdAt" | "updatedAt"
>;

export const createReview = async (review: CreateReviewRepoInput) => {
  try {
    return await prisma.review.create({
      data: {
        ...review
      }
    });
  } catch (err) {
    console.error("Error at createReview", err);
    throw err;
  }
}

