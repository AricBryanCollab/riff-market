import { create } from "zustand";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";

interface PendingListingStore {
	pendingListings: ListingResponse[];
	pendingListingCount: number;
	showPending: boolean;
	setPendingListings: (listings: ListingResponse[]) => void;
	setShowPending: () => void;
	addPendingListing: (listing: ListingResponse) => void;
	removePendingListing: (listingId: string) => void;
	updatePendingListing: (id: string, updatedListing: ListingResponse) => void;
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
