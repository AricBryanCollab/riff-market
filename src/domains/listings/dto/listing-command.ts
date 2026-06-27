import type { ListingStatus } from "@/domains/listings/domain/listing";
import type { ProductCategory, ProductCondition } from "@/types/enum";

export type ListingProductFormDraftFields = {
	readonly name: string;
	readonly category: ProductCategory;
	readonly condition: ProductCondition;
	readonly brand: string;
	readonly model: string;
	readonly description: string;
	readonly price: number;
	readonly stock: number;
};

export type UpdateListingProductFormDraft = ListingProductFormDraftFields & {
	readonly images: (File | string)[];
};

export type ListingMutationProductDto = {
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
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus?: ListingStatus;
	readonly createdAt?: string;
	readonly updatedAt?: string;
};

export type ProductListingMutationResponse = {
	readonly message: string;
	readonly product: ListingMutationProductDto;
};

export type ProductListingRemovalResponse = {
	readonly message: string;
	readonly product: {
		readonly listingId: string;
		readonly mode: "DELETED" | "WITHDRAWN";
		readonly message: string;
	};
};

export type ProductListingModerationRequest = {
	readonly id: string;
	readonly isApproved: boolean;
};

export type ProductListingModerationResult = {
	readonly id: string;
	readonly name: string;
	readonly isApproved: boolean;
	readonly status?: ListingStatus;
	readonly listingStatus?: ListingStatus;
};
