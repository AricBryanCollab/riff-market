import type { Prisma } from "generated/prisma/client";

import {
	Listing,
	ListingPurchaseError,
	type ListingStatus,
} from "@/domains/listings/domain/listing";
import { Money } from "@/domains/shared/domain/money";
import { err, ok } from "@/domains/shared/domain/result";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";
import {
	type ListingsForPurchasePort,
	type PlacePurchaseError,
	type PlacePurchaseItem,
	placePurchaseError,
	type ReservedSellerListingGroup,
} from "../application/place-purchase";

type ListingForPurchase = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: string;
	readonly condition: string;
	readonly brand: string;
	readonly model: string;
	readonly images: Prisma.JsonValue;
	readonly priceCents: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly listingStatus: ListingStatus;
	readonly seller: {
		readonly firstName: string;
		readonly lastName: string;
	};
};

export class PrismaListingsForPurchase
	implements ListingsForPurchasePort<PrismaTransactionContext>
{
	async reserveForPurchase(
		context: PrismaTransactionContext,
		items: PlacePurchaseItem[],
	) {
		const requestedItems = aggregateRequestedItems(items);
		const listings = await context.listing.findMany({
			where: {
				id: {
					in: requestedItems.map((item) => item.listingId),
				},
			},
			select: {
				id: true,
				sellerId: true,
				name: true,
				category: true,
				condition: true,
				brand: true,
				model: true,
				images: true,
				priceCents: true,
				currencyCode: true,
				stock: true,
				listingStatus: true,
				seller: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
			},
		});
		const listingsById = new Map(
			listings.map((listing) => [listing.id, listing]),
		);

		for (const requestedItem of requestedItems) {
			const listing = listingsById.get(requestedItem.listingId);

			if (!listing) {
				return err(
					placePurchaseError(
						"PLACE_PURCHASE_LISTING_NOT_FOUND",
						`Listing ${requestedItem.listingId} was not found`,
						"not-found",
					),
				);
			}

			const listingOrError = toListing(listing);
			if (!listingOrError.ok) {
				return err(listingOrError.error);
			}

			try {
				listingOrError.value.reserveForPurchase(requestedItem.quantity);
			} catch (error) {
				return err(mapListingError(error));
			}
		}

		const reservedGroups = new Map<string, ReservedSellerListingGroup>();

		for (const requestedItem of requestedItems) {
			const updateResult = await context.listing.updateMany({
				where: {
					id: requestedItem.listingId,
					listingStatus: "APPROVED",
					stock: {
						gte: requestedItem.quantity,
					},
				},
				data: {
					stock: {
						decrement: requestedItem.quantity,
					},
				},
			});

			if (updateResult.count !== 1) {
				return err(
					placePurchaseError(
						"PLACE_PURCHASE_INSUFFICIENT_STOCK",
						`Insufficient stock for listing ${requestedItem.listingId}`,
						"conflict",
					),
				);
			}

			const listing = listingsById.get(requestedItem.listingId);
			if (!listing) {
				return err(
					placePurchaseError(
						"PLACE_PURCHASE_LISTING_NOT_FOUND",
						`Listing ${requestedItem.listingId} was not found`,
						"not-found",
					),
				);
			}

			const listingOrError = toListing(listing);
			if (!listingOrError.ok) {
				return err(listingOrError.error);
			}

			const reservedItem = listingOrError.value.reserveForPurchase(
				requestedItem.quantity,
			);
			const group = reservedGroups.get(reservedItem.sellerId);

			if (group) {
				group.items.push(reservedItem);
			} else {
				reservedGroups.set(reservedItem.sellerId, {
					sellerId: reservedItem.sellerId,
					items: [reservedItem],
				});
			}
		}

		return ok([...reservedGroups.values()]);
	}
}

function aggregateRequestedItems(items: PlacePurchaseItem[]) {
	const quantitiesByListingId = new Map<string, number>();

	for (const item of items) {
		quantitiesByListingId.set(
			item.listingId,
			(quantitiesByListingId.get(item.listingId) ?? 0) + item.quantity,
		);
	}

	return [...quantitiesByListingId.entries()].map(([listingId, quantity]) => ({
		listingId,
		quantity,
	}));
}

function toListing(listing: ListingForPurchase) {
	const primaryImageUrl = getPrimaryImageUrl(listing.images);
	if (!primaryImageUrl) {
		return err(
			placePurchaseError(
				"PLACE_PURCHASE_INVARIANT_FAILED",
				`Listing ${listing.id} is missing a primary image snapshot`,
				"invariant",
			),
		);
	}

	return ok(
		Listing.reconstitute({
			id: listing.id,
			sellerId: listing.sellerId,
			sellerDisplayName: [listing.seller.firstName, listing.seller.lastName]
				.join(" ")
				.trim(),
			name: listing.name,
			brand: listing.brand,
			model: listing.model,
			category: listing.category,
			condition: listing.condition,
			primaryImageUrl,
			price: Money.fromCents(listing.priceCents, listing.currencyCode),
			stock: listing.stock,
			status: listing.listingStatus,
		}),
	);
}

function getPrimaryImageUrl(images: Prisma.JsonValue) {
	if (!Array.isArray(images)) {
		return null;
	}

	for (const image of images) {
		if (
			image &&
			typeof image === "object" &&
			"url" in image &&
			typeof image.url === "string" &&
			image.url.trim().length > 0
		) {
			return image.url;
		}
	}

	return null;
}

function mapListingError(error: unknown): PlacePurchaseError {
	if (error instanceof ListingPurchaseError) {
		if (error.code === "LISTING_NOT_ORDERABLE") {
			return placePurchaseError(
				"PLACE_PURCHASE_LISTING_NOT_ORDERABLE",
				error.message,
				"conflict",
			);
		}

		if (error.code === "LISTING_INSUFFICIENT_STOCK") {
			return placePurchaseError(
				"PLACE_PURCHASE_INSUFFICIENT_STOCK",
				error.message,
				"conflict",
			);
		}
	}

	return placePurchaseError(
		"PLACE_PURCHASE_INVARIANT_FAILED",
		error instanceof Error ? error.message : "Listing reservation failed",
		"invariant",
		error,
	);
}
