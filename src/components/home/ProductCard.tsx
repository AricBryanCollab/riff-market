import { Link } from "@tanstack/react-router";
import MusicNote from "@/assets/musicnote";
import ConditionBadge from "@/components/home/ConditionBadge";
import type { BaseProduct } from "@/types/product";

interface ProductCardProps {
	product: BaseProduct;
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
					<MusicNote size={16} />
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
