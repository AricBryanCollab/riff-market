import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";

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
	readonly listing: ListingReadDto;
};

export type UnavailableCartLine = CartLineBase & {
	readonly status: "unavailable";
};

export type CartLine = AvailableCartLine | UnavailableCartLine;
