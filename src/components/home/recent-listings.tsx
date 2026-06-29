import { EmptyRecentListings } from "@/components/empty-states";
import { RecentListingsError } from "@/components/error-states";
import ListingCard from "@/components/listing-card";
import { RecentListingsLoading } from "@/components/loading-states";

import useGetRecentListings from "@/hooks/use-get-recent-listings";

const RecentListings = () => {
	const {
		recentListings,
		isLoadingRecentListings,
		isErrorRecentListings,
		refetchRecentListings,
	} = useGetRecentListings();

	if (isLoadingRecentListings) {
		return <RecentListingsLoading />;
	}

	if (isErrorRecentListings) {
		return <RecentListingsError refetch={refetchRecentListings} />;
	}

	if (!recentListings || recentListings.length === 0) {
		return <EmptyRecentListings />;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{recentListings.map((listing) => (
				<ListingCard key={listing.id} listing={listing} />
			))}
		</div>
	);
};

export default RecentListings;
