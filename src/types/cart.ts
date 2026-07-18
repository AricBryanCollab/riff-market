import type { ListingResponse } from "@/domains/listings/dto/listing-view";

type CartDetailBase = {
	readonly listingId: string;
	readonly quantity: number;
	readonly title: string;
	readonly description: string;
	readonly unitPriceText: string;
	readonly subtotalText: string;
	readonly imageUrl?: string;
	readonly imageAlt: string;
};

export type AvailableCartDetail = CartDetailBase & {
	readonly status: "available";
	readonly listing: ListingResponse;
};

export type UnavailableCartDetail = CartDetailBase & {
	readonly status: "unavailable";
};

export type CartDetail = AvailableCartDetail | UnavailableCartDetail;
