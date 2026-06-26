import { z } from "zod";
import {
	createListingReview,
	getListingReviews,
	type ListingReviewPort,
	type ReviewError,
} from "@/domains/reviews/application/review-use-cases";
import {
	type CreateListingReviewInput,
	createListingReviewSchema,
	type GetListingReviewsQuery,
	getListingReviewsQuerySchema,
	type ListingReview,
} from "@/domains/reviews/dto/listing-review";
import type { Actor } from "@/domains/shared/domain/actor";
import { toAppErrorStatus } from "@/server/app-error-status";
import type { ServerUserContext } from "@/server/function-middleware";

export type ReviewCreationResponse = {
	readonly review: ListingReview;
	readonly message: string;
};

export class ReviewRequestError extends Error {
	readonly code?: string;
	readonly details?: unknown;
	readonly status: number;

	constructor(
		message: string,
		options: { code?: string; details?: unknown; status?: number } = {},
	) {
		super(message);
		this.name = "ReviewRequestError";
		this.code = options.code;
		this.details = options.details;
		this.status = options.status ?? 400;
	}
}

export function validateCreateListingReviewInput(
	data: unknown,
): CreateListingReviewInput {
	const parsed = createListingReviewSchema.safeParse(data);

	if (!parsed.success) {
		throw new ReviewRequestError("Invalid data to create review", {
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
		throw new ReviewRequestError("Invalid review query", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function createListingReviewForCurrentUser(
	user: ServerUserContext,
	input: CreateListingReviewInput,
	reviews?: ListingReviewPort,
): Promise<ReviewCreationResponse> {
	const reviewPort = reviews ?? (await createPrismaReviewDependencies());
	const result = await createListingReview(input, toActor(user), reviewPort);

	if (!result.ok) {
		throw toReviewRequestError(result.error);
	}

	return {
		review: result.value,
		message: "Review created successfully",
	};
}

export async function listListingReviews(
	input: GetListingReviewsQuery,
	reviews?: ListingReviewPort,
): Promise<ListingReview[]> {
	const reviewPort = reviews ?? (await createPrismaReviewDependencies());
	const result = await getListingReviews(input.listingId, reviewPort);

	if (!result.ok) {
		throw toReviewRequestError(result.error);
	}

	return result.value;
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

function toReviewRequestError(error: ReviewError) {
	return new ReviewRequestError(error.message, {
		code: error.code,
		details: error.details,
		status: toAppErrorStatus(error.kind),
	});
}
