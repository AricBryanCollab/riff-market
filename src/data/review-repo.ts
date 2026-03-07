import type { Review } from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import { logger } from "@/lib/logger";

type CreateReviewRepoInput = Omit<Review, "id" | "createdAt" | "updatedAt">;

export const getReviewsByProductId = async (productId: string) => {
	try {
		return await prisma.review.findMany({
			where: { productId },
			orderBy: { createdAt: "desc" },
			include: {
				user: {
					select: { firstName: true, lastName: true },
				},
			},
		});
	} catch (err) {
		logger.error("Error at getReviewsByProductId", err);
		throw err;
	}
};

export const getReviewById = async (reviewId: string) => {
	try {
		return await prisma.review.findFirst({
			where: { id: reviewId },
		});
	} catch (err) {
		logger.error("Error at getReviewById", err);
		throw err;
	}
};

export const createReview = async (review: CreateReviewRepoInput) => {
	try {
		return await prisma.review.create({
			data: {
				...review,
			},
		});
	} catch (err) {
		logger.error("Error at createReview", err);
		throw err;
	}
};
