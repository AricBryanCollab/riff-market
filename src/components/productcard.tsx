import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import type { BaseProduct } from "@/types/product";

interface ProductCardProps {
	product: BaseProduct;
	onClick?: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
	const isOutOfStock = product.stock === 0;
	const isLowStock = product.stock > 0 && product.stock <= 3;
	const sellerName = `${product.seller.firstName} ${product.seller.lastName}`;

	return (
		<Card className="flex flex-col max-h-125 hover:shadow-lg transition-shadow duration-200 group">
			<CardHeader className="p-0">
				<Link
					to="/product/$id"
					params={{ id: product.id }}
					className="relative block h-48 rounded-t-lg bg-accent overflow-hidden"
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
				</Link>
			</CardHeader>

			<CardContent className="flex-1 p-4 flex flex-col">
				{/* Brand */}
				<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
					{product.brand}
				</div>

				{/* Product Name  */}
				<Link
					to="/product/$id"
					params={{ id: product.id }}
					className="text-sm font-semibold text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors min-h-10"
					onClick={(e) => {
						if (onClick) {
							e.preventDefault();
							onClick();
						}
					}}
				>
					{product.name}
				</Link>

				{/* Model */}
				<div className="text-xs text-muted-foreground mb-3 line-clamp-1">
					{product.model}
				</div>

				{/* Seller Info */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<User className="size-3.5 shrink-0" />
					<span className="truncate">By {sellerName}</span>
				</div>
			</CardContent>

			<CardFooter className="p-4 pt-0 flex flex-col gap-3">
				{/* Price and Stock */}
				<div className="flex items-center justify-between">
					<span className="text-lg font-bold text-primary">
						${product.price.toLocaleString()}
					</span>
					{!isOutOfStock && (
						<span className="text-xs text-muted-foreground">
							{product.stock} in stock
						</span>
					)}
				</div>

				{isOutOfStock ? (
					<button
						type="button"
						disabled
						className="w-full py-2 px-4 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed"
					>
						Out of Stock
					</button>
				) : (
					<Link
						to="/product/$id"
						params={{ id: product.id }}
						className="w-full py-2 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium text-center transition-colors"
						onClick={(e) => {
							if (onClick) {
								e.preventDefault();
								onClick();
							}
						}}
					>
						View Details
					</Link>
				)}
			</CardFooter>
		</Card>
	);
};

export default ProductCard;
