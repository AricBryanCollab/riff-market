import { Link } from "@tanstack/react-router";
import { featuredProducts } from "./mocks";
import ProductGrid from "./product-grid";

const FeaturedProducts = () => {
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
			<ProductGrid products={featuredProducts} />
		</section>
	);
};

export default FeaturedProducts;
