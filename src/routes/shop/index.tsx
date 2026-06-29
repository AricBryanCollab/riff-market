import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { ListingErrorState } from "@/components/error-states";
import ListingCard from "@/components/listing-card";
import ListingFilterBadges from "@/components/listing-filter-badges";
import { ListingLoadingState } from "@/components/loading-states";
import { ShopPageHeader } from "@/components/page-headers";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
	approvedListingsQueryOpt,
	listingCountByStatusQueryOpt,
} from "@/hooks/use-get-listings";
import useGetPendingListings from "@/hooks/use-get-pending-listings";
import useShopPagination from "@/hooks/use-shop-pagination";
import { usePendingListingStore } from "@/store/pending-listing";
import { getApprovedFiltersFromSearch } from "@/utils/shop-search";
import { validateListingSearch } from "@/utils/validate-listing-search";

export const Route = createFileRoute("/shop/")({
	beforeLoad: async ({ context, search }) => {
		const filters = getApprovedFiltersFromSearch(search);

		await Promise.all([
			context.queryClient
				.ensureQueryData(approvedListingsQueryOpt(filters))
				.catch(() => undefined),
			context.queryClient
				.ensureQueryData(listingCountByStatusQueryOpt("approved"))
				.catch(() => undefined),
		]);
	},
	component: RouteComponent,
	validateSearch: validateListingSearch,
});

function RouteComponent() {
	const { showPending } = usePendingListingStore();
	const { data: user } = useAuthUser();
	const isAdmin = user?.role === "ADMIN";

	const {
		listings,
		isLoading,
		isError,
		refetchListings,
		page,
		totalPages,
		isFirstPage,
		isLastPage,
		previousPage,
		nextPage,
	} = useShopPagination();

	const {
		pendingListings,
		isLoadingPendingListings,
		isErrorPendingListings,
		refetch: refetchPendingListings,
	} = useGetPendingListings({ isAdmin });

	const displayListings = showPending ? pendingListings : listings;
	const displayIsLoading = showPending ? isLoadingPendingListings : isLoading;
	const displayIsError = showPending ? isErrorPendingListings : isError;
	const displayRefetch = showPending ? refetchPendingListings : refetchListings;

	return (
		<SectionContainer>
			<ShopPageHeader />

			<ListingFilterBadges />

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-200">
				{displayIsLoading ? (
					<ListingLoadingState />
				) : displayIsError || !displayListings ? (
					<ListingErrorState refetch={displayRefetch} />
				) : displayListings.length > 0 ? (
					displayListings.map((listing) => (
						<ListingCard key={listing.id} listing={listing} />
					))
				) : (
					<div className="col-span-full flex flex-col justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ListMusic size={40} />
						<H3>
							{showPending
								? "No pending listings for approval"
								: "No listings match your search here"}
						</H3>
					</div>
				)}
			</div>

			<div className="flex justify-center py-6">
				<div className="flex items-center gap-2">
					<Button
						onClick={previousPage}
						disabled={isFirstPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Previous
					</Button>
					<span className="px-4 py-2 text-sm text-muted-foreground">
						Page {page + 1} of {totalPages}
					</span>

					<Button
						onClick={nextPage}
						disabled={isLastPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Next
					</Button>
				</div>
			</div>
		</SectionContainer>
	);
}
