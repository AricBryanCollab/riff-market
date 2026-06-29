import { Link } from "@tanstack/react-router";
import ListingGrid from "./listing-grid";
import { featuredListings } from "./mocks";

const FeaturedListings = () => {
	return (
		<section className="py-12">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold text-foreground">
					Featured Gear
				</h2>
				<Link
					to="/shop"
					className="text-primary hover:text-primary-hover font-medium"
				>
					View all →
				</Link>
			</div>
			<ListingGrid listings={featuredListings} />
		</section>
	);
};

export default FeaturedListings;
