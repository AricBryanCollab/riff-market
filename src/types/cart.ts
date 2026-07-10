import type { ListingResponse } from "@/domains/listings/dto/listing-view";

type CartLineBase = {
	readonly listingId: string;
	readonly quantity: number;
	readonly title: string;
	readonly description: string;
	readonly unitPriceText: string;
	readonly subtotalText: string;
	readonly imageUrl?: string;
	readonly imageAlt: string;
};

export type AvailableCartLine = CartLineBase & {
	readonly status: "available";
	readonly listing: ListingResponse;
};

export type UnavailableCartLine = CartLineBase & {
	readonly status: "unavailable";
};

export type CartLine = AvailableCartLine | UnavailableCartLine;
