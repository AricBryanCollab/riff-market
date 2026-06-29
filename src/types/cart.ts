import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";

export interface CartItem {
	listing: ListingReadDto | undefined;
	isLoading: boolean;
	isError: boolean;
	productId: string;
	quantity: number;
}
