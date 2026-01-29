import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, Package } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import { BodySmall, H5 } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BaseProduct } from "@/types/product";

interface PendingProductListProps {
	pendingProducts: BaseProduct[];
	pendingProductCount: number;
	isLoading: boolean;
	isEmptyPendingProducts: boolean;
}

const PendingProductList = ({
	pendingProducts,
	pendingProductCount,
	isLoading,
	isEmptyPendingProducts,
}: PendingProductListProps) => {
	const formatRelativeTime = (date: string) => {
		return formatDistanceToNow(new Date(date), { addSuffix: true });
	};

	if (isLoading) {
		return (
			<div className="w-80 max-w-sm bg-background">
				<div className="px-4 py-3 border-b border-border">
					<H5 className="font-semibold text-foreground">Pending Approval</H5>
				</div>
				<div className="max-h-96 overflow-y-auto px-4 py-3">
					<AnimatedLoader
						svgSize={80}
						pingSize="size-24"
						textSize="text-base"
						containerSizeClass="w-fit min-h-fit mx-auto py-8"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="w-80 max-w-sm bg-background">
			<div className="px-4 py-3 border-b border-border">
				<H5 className="font-semibold text-foreground">Pending Approval</H5>
				{!isEmptyPendingProducts && (
					<BodySmall className="text-muted-foreground mt-0.5">
						{pendingProductCount}{" "}
						{pendingProductCount === 1 ? "product" : "products"} awaiting
						approval
					</BodySmall>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{isEmptyPendingProducts && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-3">
							<Package className="size-8 text-muted-foreground" />
						</div>
						<BodySmall className="text-muted-foreground">
							No pending products
						</BodySmall>
						<BodySmall className="text-muted-foreground/70 text-xs mt-1">
							All your products have been reviewed
						</BodySmall>
					</div>
				)}

				{!isEmptyPendingProducts && (
					<ul className="space-y-2">
						{pendingProducts.slice(0, 5).map((product) => (
							<li
								key={product.id}
								className="p-3 rounded-lg transition-colors hover:bg-accent/50 border border-border"
							>
								<div className="flex gap-3">
									{/* Product Image */}
									{product.images?.[0] && (
										<div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
											<img
												src={product.images[0]}
												alt={product.name}
												className="w-full h-full object-cover"
											/>
										</div>
									)}

									{/* Product Details */}
									<div className="flex-1 min-w-0 space-y-1.5">
										<div className="flex items-start justify-between gap-2">
											<h6 className="text-sm font-medium text-foreground truncate">
												{product.name}
											</h6>
											<Badge className="flex items-center px-1 py-0.5 rounded-md text-xs shrink-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
												<Clock className="size-3 mr-1" />
												Pending
											</Badge>
										</div>

										<div className="space-y-0.5">
											<p className="text-xs text-muted-foreground truncate">
												{product.brand} • {product.model}
											</p>
											<p className="text-xs text-muted-foreground">
												{product.category}
											</p>
										</div>

										<div className="flex items-center justify-between pt-0.5">
											<span className="text-sm font-semibold text-foreground">
												${product.price.toFixed(2)}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(product?.createdAt || "NaN")}
											</span>
										</div>
									</div>
								</div>
							</li>
						))}

						{pendingProductCount > 5 && (
							<div className="text-center pt-2 pb-1">
								<BodySmall className="text-muted-foreground/80 text-xs">
									+{pendingProductCount - 5} more{" "}
									{pendingProductCount - 5 === 1 ? "product" : "products"}
								</BodySmall>
							</div>
						)}
					</ul>
				)}
			</div>

			{!isEmptyPendingProducts && (
				<div className="px-4 py-3 border-t border-border bg-muted/30">
					<Button variant="ghost" className="w-full text-sm group">
						<Link
							to="/shop"
							className="flex items-center justify-center gap-2 w-full"
						>
							<span>View All Pending Products</span>
							<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
};

export default PendingProductList;
