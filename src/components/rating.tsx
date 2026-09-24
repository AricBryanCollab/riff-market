import { Star } from "lucide-react";
import { useListingReviews } from "@/hooks/use-listing-reviews";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
	rating: number;
	className?: string;
	starClassName?: string;
}

export function RatingStars({
	rating,
	className,
	starClassName = "size-4",
}: RatingStarsProps) {
	const filledStars = Math.round(rating);

	return (
		<div
			role="img"
			aria-label={`${rating.toFixed(1)} out of 5 stars`}
			className={cn("flex gap-0.5", className)}
		>
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					aria-hidden
					className={cn(
						starClassName,
						star <= filledStars
							? "fill-yellow-400 text-yellow-400"
							: "fill-gray-200 text-gray-200 dark:fill-white/15 dark:text-white/15",
					)}
				/>
			))}
		</div>
	);
}

const Rating = ({ listingId }: { listingId: string }) => {
	const { summary, isPending } = useListingReviews(listingId);
	const { averageRating, reviewCount } = summary;

	if (isPending) {
		return <div className="h-5 w-40 rounded-full bg-muted animate-pulse" />;
	}

	return (
		<a
			href="#reviews"
			className="group flex w-fit items-center gap-2.5 text-sm text-muted-foreground"
		>
			<RatingStars rating={averageRating} />
			{reviewCount > 0 ? (
				<span className="tabular-nums">
					<span className="font-semibold text-foreground">
						{averageRating.toFixed(1)}
					</span>{" "}
					<span className="underline-offset-4 group-hover:underline">
						({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
					</span>
				</span>
			) : (
				<span className="underline-offset-4 group-hover:underline">
					No reviews yet
				</span>
			)}
		</a>
	);
};

export default Rating;
