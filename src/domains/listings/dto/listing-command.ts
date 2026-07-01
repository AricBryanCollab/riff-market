import type { ListingStatus } from "@/domains/listings/domain/listing";
import type { ListingImageDto } from "@/domains/listings/dto/listing-read-model";
import type { ListingCategory, ListingCondition } from "@/types/enum";

export type ListingFormDraftFields = {
	readonly name: string;
	readonly category: ListingCategory;
	readonly condition: ListingCondition;
	readonly brand: string;
	readonly model: string;
	readonly description: string;
	readonly price: number;
	readonly stock: number;
};

export type UpdateListingFormDraft = ListingFormDraftFields & {
	readonly images: ListingImageDto[];
};

export type ListingMutationDto = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: string;
	readonly condition?: string;
	readonly brand: string;
	readonly model: string;
	readonly images: ListingImageDto[];
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus?: ListingStatus;
	readonly createdAt?: string;
	readonly updatedAt?: string;
};

export type ListingMutationResponseDto = {
	readonly message: string;
	readonly listing: ListingMutationDto;
};

export type ListingRemovalResponseDto = {
	readonly message: string;
	readonly listing: {
		readonly listingId: string;
		readonly mode: "DELETED" | "WITHDRAWN";
		readonly message: string;
	};
};

export type ListingModerationRequestDto = {
	readonly listingId: string;
	readonly shouldApproveListing: boolean;
};

export type ListingModerationResultDto = {
	readonly id: string;
	readonly name: string;
	readonly isApproved: boolean;
	readonly status?: ListingStatus;
	readonly listingStatus?: ListingStatus;
};
