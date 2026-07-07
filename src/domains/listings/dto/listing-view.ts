import type { ListingStatus } from "@/domains/listings/domain/listing";
import type { ListingCategory, ListingCondition } from "@/types/enum";

export type ListingViewStatus = ListingStatus;
export type ListingCountStatus = Extract<
	ListingViewStatus,
	"APPROVED" | "PENDING"
>;

export type ListingViewCategory = ListingCategory;
export type ListingViewCondition = ListingCondition;

export type ListingViewSeller = {
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
};

export type ListingImageDto = {
	readonly imageId: string;
	readonly url: string;
};

export type ListingView = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ListingViewCategory;
	readonly condition: ListingViewCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: ListingImageDto[];
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly listingStatus: ListingViewStatus;
	readonly isOrderable: boolean;
	readonly viewerCanEdit: boolean;
	readonly viewerCanDelete: boolean;
	readonly viewerCanApprove: boolean;
	readonly viewerCanDecline: boolean;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
	readonly seller: ListingViewSeller;
};

export type ListingResponse = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ListingViewCategory;
	readonly condition: ListingViewCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: ListingImageDto[];
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus?: ListingViewStatus;
	readonly isOrderable: boolean;
	readonly viewerCanEdit: boolean;
	readonly viewerCanDelete: boolean;
	readonly viewerCanApprove: boolean;
	readonly viewerCanDecline: boolean;
	readonly createdAt?: string;
	readonly updatedAt?: string;
	readonly seller: ListingViewSeller;
};

export type ListingCategoryCount = {
	readonly category: ListingViewCategory;
	readonly count: number;
};

export type ListingCategoryCountData = ListingCategoryCount;

export type ListingBrandCount = {
	readonly brand: string;
	readonly count: number;
};

export type ListingBrandCountData = ListingBrandCount;

export type ListingCategoryMeta = {
	readonly category: ListingViewCategory;
	readonly label: string;
	readonly icon: string;
	readonly count: number;
};

export type ApprovedListingCount = {
	readonly approvedListingCount: number;
};

export type PendingListingCount = {
	readonly pendingListingCount: number;
};

export type ListingStatusCount = ApprovedListingCount | PendingListingCount;
