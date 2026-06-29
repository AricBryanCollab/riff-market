import { create } from "zustand";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";

interface PendingListingStore {
	pendingListings: ListingReadDto[];
	pendingListingCount: number;
	showPending: boolean;
	setPendingListings: (listings: ListingReadDto[]) => void;
	setShowPending: () => void;
	addPendingListing: (listing: ListingReadDto) => void;
	removePendingListing: (listingId: string) => void;
	updatePendingListing: (id: string, updatedListing: ListingReadDto) => void;
}

export const usePendingListingStore = create<PendingListingStore>((set) => ({
	pendingListings: [],
	pendingListingCount: 0,
	showPending: false,

	setPendingListings: (listings) =>
		set({
			pendingListings: listings,
			pendingListingCount: listings.length,
		}),

	setShowPending: () => set((state) => ({ showPending: !state.showPending })),

	addPendingListing: (listing) =>
		set((state) => ({
			pendingListings: [listing, ...state.pendingListings],
			pendingListingCount: state.pendingListingCount + 1,
		})),

	removePendingListing: (listingId) =>
		set((state) => ({
			pendingListings: state.pendingListings.filter((p) => p.id !== listingId),
			pendingListingCount: state.pendingListingCount - 1,
		})),

	updatePendingListing: (id, updatedListing) =>
		set((state) => ({
			pendingListings: state.pendingListings.map((p) =>
				p.id === id ? updatedListing : p,
			),
		})),
}));
