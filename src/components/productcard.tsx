import type { BaseProduct } from "@/types/product";

interface ProductCardProps {
	product: BaseProduct;
	onClick?: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
	const isOutOfStock = product.stock === 0;
	const isLowStock = product.stock > 0 && product.stock <= 5;

	return (
		<div className="flex flex-col rounded-xl bg-background/90 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group">
			{/* Image Container - Clickable */}
			<a
				href={`/products/${product.id}`}
				className="relative mb-4 h-40 rounded-lg bg-slate-200 overflow-hidden block"
				onClick={(e) => {
					if (onClick) {
						e.preventDefault();
						onClick();
					}
				}}
			>
				<img
					src={
						product.images[0] ||
						"https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400"
					}
					alt={product.name}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
				/>

				{/* Stock Badge */}
				{isOutOfStock && (
					<div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
						Out of Stock
					</div>
				)}
				{isLowStock && (
					<div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
						{product.stock} left
					</div>
				)}
			</a>

			{/* Brand */}
			<div className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">
				{product.brand}
			</div>

			{/* Product Name - Clickable */}
			<a
				href={`/products/${product.id}`}
				className="text-sm font-semibold text-black line-clamp-2 mb-1 hover:text-primary transition-colors"
				onClick={(e) => {
					if (onClick) {
						e.preventDefault();
						onClick();
					}
				}}
			>
				{product.name}
			</a>

			{/* Model */}
			<div className="text-xs text-secondary mb-3">{product.model}</div>

			{/* Price and Buy Button */}
			<div className="mt-auto">
				<div className="flex items-center justify-between mb-3">
					<span className="text-lg font-bold text-primary">
						${product.price.toLocaleString()}
					</span>
					{!isOutOfStock && (
						<span className="text-xs text-slate-500">
							{product.stock} in stock
						</span>
					)}
				</div>

				{/* Buy Button */}
				{isOutOfStock ? (
					<button
						type="button"
						disabled
						className="w-full py-2 px-4 rounded-lg bg-foreground/30 text-foreground text-sm font-medium cursor-not-allowed"
					>
						Out of Stock
					</button>
				) : (
					<a
						href={`/products/${product.id}`}
						className="block w-full py-2 px-4 rounded-lg bg-primary hover:bg-accent text-white text-sm font-medium text-center transition-colors"
						onClick={(e) => {
							if (onClick) {
								e.preventDefault();
								onClick();
							}
						}}
					>
						View Details
					</a>
				)}
			</div>
		</div>
	);
};
export default ProductCard;
