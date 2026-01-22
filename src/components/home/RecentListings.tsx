import { Link } from "@tanstack/react-router";
import { recentProducts } from "./mocks";
import ProductGrid from "./ProductGrid";

const RecentListings = () => {
	return (
		<section className="py-12">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-xl font-semibold text-foreground">
					Recent Listings
				</h2>
				<Link
					to="/shop"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					View all →
				</Link>
			</div>
			<ProductGrid products={recentProducts} />
		</section>
	);
};

export default RecentListings;
