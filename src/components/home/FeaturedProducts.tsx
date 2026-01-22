import { Link } from "@tanstack/react-router";
import { featuredProducts } from "./mocks";
import ProductGrid from "./ProductGrid";

const FeaturedProducts = () => {
	return (
		<section className="py-12">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-secondary font-semibold text-foreground">
					Featured Gear
				</h2>
				<Link
					to="/shop"
					className="text-primary hover:text-primary-hover font-medium"
				>
					View all →
				</Link>
			</div>
			<ProductGrid products={featuredProducts} />
		</section>
	);
};

export default FeaturedProducts;
