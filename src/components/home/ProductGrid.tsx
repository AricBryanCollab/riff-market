import FeaturedProductCard from "@/components/home/FeaturedProductCard";
import type { BaseProduct } from "@/types/product";

interface ProductGridProps {
	products: BaseProduct[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{products.map((product) => (
				<FeaturedProductCard key={product.id} product={product} />
			))}
		</div>
	);
};

export default ProductGrid;
