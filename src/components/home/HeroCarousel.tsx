import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Product } from "@/types/product";
import ConditionBadge from "./ConditionBadge";

interface HeroCarouselProps {
	products: Product[];
	autoPlayInterval?: number;
}

const HeroCarousel = ({
	products,
	autoPlayInterval = 5000,
}: HeroCarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev + 1) % products.length);
	}, [products.length]);

	const goToPrev = useCallback(() => {
		setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
	}, [products.length]);

	useEffect(() => {
		const timer = setInterval(goToNext, autoPlayInterval);
		return () => clearInterval(timer);
	}, [goToNext, autoPlayInterval]);

	const product = products[currentIndex];

	return (
		<section className="py-16">
			<div className="grid md:grid-cols-2 gap-12 items-center">
				<div className="relative">
					<Link
						to="/product/$id"
						params={{ id: product.id }}
						className="block relative aspect-square bg-muted rounded-2xl overflow-hidden"
					>
						<div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
							<svg
								className="w-32 h-32"
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
					</Link>

					<Button
						variant="outline"
						size="icon"
						onClick={goToPrev}
						aria-label="Previous item"
						className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
					>
						<ChevronLeft className="w-5 h-5" />
					</Button>

					<Button
						variant="outline"
						size="icon"
						onClick={goToNext}
						aria-label="Next item"
						className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
					>
						<ChevronRight className="w-5 h-5" />
					</Button>

					<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
						{products.map((_, index) => (
							<button
								key={products[index].id}
								type="button"
								onClick={() => setCurrentIndex(index)}
								className={`w-2 h-2 rounded-full transition-colors ${
									index === currentIndex ? "bg-foreground" : "bg-foreground/30"
								}`}
								aria-label={`Go to item ${index + 1}`}
							/>
						))}
					</div>
				</div>

				<div className="flex flex-col justify-center">
					<p className="text-sm text-muted-foreground uppercase tracking-wider">
						Featured
					</p>
					<h1 className="text-4xl md:text-5xl font-semibold text-foreground mt-2 leading-tight">
						{product.name}
					</h1>
					<p className="text-muted-foreground mt-4">
						{product.brand} · {product.model}
					</p>
					<p className="text-3xl font-semibold text-foreground mt-6">
						$
						{product.price.toLocaleString("en-US", {
							minimumFractionDigits: 2,
						})}
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						Sold by {product.sellerName}
					</p>

					<Link
						to="/product/$id"
						params={{ id: product.id }}
						className={buttonVariants({ size: "lg", className: "mt-8 w-fit" })}
					>
						View Listing
					</Link>
				</div>
			</div>
		</section>
	);
};

export default HeroCarousel;
