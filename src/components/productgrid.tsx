import { ListMusic } from "lucide-react";
import ProductCard from "@/components/productcard";
import type { BaseProduct } from "@/types/product";

interface ProductGridProps {
	products: Array<BaseProduct>;
}

export function ProductGrid({ products }: ProductGridProps) {
	if (products.length === 0) {
		return (
			<div className="col-span-full flex justify-center items-center gap-4 text-center py-8 text-muted-foreground">
				<ListMusic size={28} />
				<p>No products match your search here</p>
			</div>
		);
	}

	return (
		<>
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</>
	);
}
