import { Link } from "@tanstack/react-router";
import type { Product } from "@/types/product";
import ConditionBadge from "./ConditionBadge";

interface ProductCardProps {
	product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
	return (
		<Link
			to="/product/$id"
			params={{ id: product.id }}
			className="group block rounded-xl overflow-hidden border border-border hover:border-foreground transition-colors"
		>
			<div className="relative aspect-square bg-muted">
				<div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
					<svg
						className="w-16 h-16"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Musical note placeholder"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={0.5}
							d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
						/>
					</svg>
				</div>
				<ConditionBadge condition={product.condition} />
			</div>

			<div className="p-4">
				<p className="text-sm text-muted-foreground">
					{product.brand} · {product.model}
				</p>
				<h3 className="font-medium text-foreground mt-1 line-clamp-1">
					{product.name}
				</h3>
				<p className="text-lg font-semibold text-foreground mt-2">
					${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
				</p>
			</div>
		</Link>
	);
};

export default ProductCard;
