import type { PrismaClient } from "generated/prisma/client";
import type { ListingReviewEligibilityPort } from "@/domains/reviews/application/review-use-cases";

type ListingReviewEligibilityPrisma = Pick<PrismaClient, "sellerOrder">;

export class PrismaListingReviewEligibility
	implements ListingReviewEligibilityPort
{
	constructor(private readonly db: ListingReviewEligibilityPrisma) {}

	async hasDeliveredPurchaseOfListing(
		customerId: string,
		listingId: string,
	): Promise<boolean> {
		const sellerOrder = await this.db.sellerOrder.findFirst({
			where: {
				status: "DELIVERED",
				purchase: {
					customerIdSnapshot: customerId,
				},
				items: {
					some: {
						listingId,
					},
				},
			},
			select: {
				id: true,
			},
		});

		return sellerOrder !== null;
	}
}
