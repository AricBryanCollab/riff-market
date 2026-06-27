import FeaturedProductCard from "@/components/home/featured-product-card";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";

interface ProductGridProps {
	products: ListingReadDto[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{products.map((listing) => (
				<FeaturedProductCard key={listing.id} product={listing} />
			))}
		</div>
	);
};

export default ProductGrid;
