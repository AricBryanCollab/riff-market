import { z } from "zod";
import {
	createListingReview,
	type ListingReviewCreatePort,
	type ListingReviewPort,
	type ListingReviewQueryPort,
} from "@/domains/reviews/application/review-use-cases";
import {
	type CreateListingReviewInput,
	createListingReviewSchema,
	type GetListingReviewsQuery,
	getListingReviewsQuerySchema,
	type ListingReview,
} from "@/domains/reviews/dto/listing-review";
import type { Actor } from "@/domains/shared/domain/actor";
import type { ServerUserContext } from "@/server/function-middleware";
import { RequestError, toRequestError } from "@/server/request-error";

export type ReviewCreationResponse = {
	readonly review: ListingReview;
	readonly message: string;
};

export function validateCreateListingReviewInput(
	data: unknown,
): CreateListingReviewInput {
	const parsed = createListingReviewSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid data to create review", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateGetListingReviewsInput(
	data: unknown,
): GetListingReviewsQuery {
	const parsed = getListingReviewsQuerySchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid review query", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function createListingReviewForCurrentUser(
	user: ServerUserContext,
	input: CreateListingReviewInput,
	reviews?: ListingReviewCreatePort,
): Promise<ReviewCreationResponse> {
	const reviewPort = reviews ?? (await createPrismaReviewDependencies());
	const result = await createListingReview(input, toActor(user), reviewPort);

	if (!result.ok) {
		throw toRequestError(result.error);
	}

	return {
		review: result.value,
		message: "Review created successfully",
	};
}

export async function listListingReviews(
	input: GetListingReviewsQuery,
	reviews?: ListingReviewQueryPort,
): Promise<ListingReview[]> {
	const reviewPort = reviews ?? (await createPrismaReviewDependencies());

	return reviewPort.listByListingId(input.listingId);
}

async function createPrismaReviewDependencies(): Promise<ListingReviewPort> {
	const [{ prisma }, { PrismaListingReviews }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/reviews/infrastructure/prisma-listing-reviews"),
	]);

	return new PrismaListingReviews(prisma);
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}
