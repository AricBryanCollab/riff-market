import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import MusicNote from "@/assets/music-note";
import ConditionBadge from "@/components/home/condition-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";
import { formatMoneyAmountMinor } from "@/utils/format-money";

interface HeroCarouselProps {
	listings: ListingResponse[];
	autoPlayInterval?: number;
}

const HeroCarousel = ({
	listings,
	autoPlayInterval = 5000,
}: HeroCarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev + 1) % listings.length);
	}, [listings.length]);

	const goToPrev = useCallback(() => {
		setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
	}, [listings.length]);

	useEffect(() => {
		const timer = setInterval(goToNext, autoPlayInterval);
		return () => clearInterval(timer);
	}, [goToNext, autoPlayInterval]);

	const listing = listings[currentIndex];

	return (
		<section className="py-16">
			<div className="grid md:grid-cols-2 gap-12 items-center">
				{/* Image Section */}
				<div className="relative">
					<Link
						to="/listing/$id"
						params={{ id: listing.id }}
						className="block relative aspect-square bg-muted rounded-2xl overflow-hidden"
					>
						<div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
							{listing.images && listing.images.length > 0 ? (
								<img
									src={listing.images[0]?.url}
									alt={listing.name}
									className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
									<MusicNote size={128} />
								</div>
							)}
						</div>
						<ConditionBadge condition={listing.condition} />
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

					{/* Listing Details: Right Side */}
					<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
						{listings.map((_, index) => (
							<button
								key={listings[index].id}
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
						{listing.name}
					</h1>
					<p className="text-muted-foreground mt-4">
						{listing.brand} · {listing.model}
					</p>
					<p className="text-3xl font-semibold text-foreground mt-6">
						{formatMoneyAmountMinor(
							listing.priceAmountMinor,
							listing.currencyCode,
						)}
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						Sold by {listing.seller.firstName}{" "}
					</p>

					<Link
						to="/listing/$id"
						params={{ id: listing.id }}
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
