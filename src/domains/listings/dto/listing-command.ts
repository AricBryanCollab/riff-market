import type { ListingStatus } from "@/domains/listings/domain/listing";
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
	readonly images: (File | string)[];
};

export type ListingMutationDto = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: string;
	readonly condition?: string;
	readonly brand: string;
	readonly model: string;
	readonly images: string[];
	readonly description: string;
	readonly price: number;
	readonly priceCents: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus?: ListingStatus;
	readonly createdAt?: string;
	readonly updatedAt?: string;
};

export type ListingMutationResponseDto = {
	readonly message: string;
	readonly product: ListingMutationDto;
};

export type ListingRemovalResponseDto = {
	readonly message: string;
	readonly product: {
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
