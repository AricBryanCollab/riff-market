import FeaturedListingCard from "@/components/home/featured-listing-card";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";

interface ListingGridProps {
	listings: ListingResponse[];
}

const ListingGrid = ({ listings }: ListingGridProps) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{listings.map((listing) => (
				<FeaturedListingCard key={listing.id} listing={listing} />
			))}
		</div>
	);
};

export default ListingGrid;
