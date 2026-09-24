import { BadgeCheck, Star } from "lucide-react";
import { RatingStars } from "@/components/rating";
import type { ListingReview } from "@/domains/reviews/dto/listing-review";
import { useListingReviews } from "@/hooks/use-listing-reviews";

const reviewDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const eyebrowClassName =
	"text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";

const ReviewSection = ({ listingId }: { listingId: string }) => {
	const { reviews, summary, isPending, isError } = useListingReviews(listingId);
	const { reviewCount } = summary;

	return (
		<section
			id="reviews"
			aria-labelledby="reviews-heading"
			className="scroll-mt-24 rounded-2xl bg-white p-6 md:p-8"
		>
			<header className="flex items-end justify-between gap-4 border-b pb-6">
				<div className="space-y-1.5">
					<p className={eyebrowClassName}>From verified buyers</p>
					<h2
						id="reviews-heading"
						className="text-2xl font-semibold tracking-tight text-gray-900 text-balance"
					>
						Customer Reviews
					</h2>
				</div>
				{reviewCount > 0 && (
					<p className="text-sm text-muted-foreground tabular-nums">
						{reviewCount} {reviewCount === 1 ? "review" : "reviews"}
					</p>
				)}
			</header>

			<ReviewSectionBody
				reviews={reviews}
				summary={summary}
				isPending={isPending}
				isError={isError}
			/>
		</section>
	);
};

type ReviewSectionBodyProps = Pick<
	ReturnType<typeof useListingReviews>,
	"reviews" | "summary" | "isPending" | "isError"
>;

function ReviewSectionBody({
	reviews,
	summary,
	isPending,
	isError,
}: ReviewSectionBodyProps) {
	const { averageRating, reviewCount, distribution } = summary;

	if (isPending) {
		return <ReviewSectionSkeleton />;
	}

	if (isError) {
		return (
			<p className="pt-6 text-sm text-muted-foreground">
				Reviews couldn't be loaded right now. Please try again later.
			</p>
		);
	}

	if (reviewCount === 0) {
		return <EmptyReviews />;
	}

	return (
		<>
			<div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-12">
				<div className="flex flex-col gap-3">
					<p className="flex items-baseline gap-2">
						<span className="text-6xl font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
							{averageRating.toFixed(1)}
						</span>
						<span className="text-sm text-muted-foreground">out of 5</span>
					</p>
					<RatingStars rating={averageRating} starClassName="size-5" />
				</div>

				<ul className="flex flex-col justify-center gap-2.5">
					{distribution.map(({ stars, count }) => (
						<li
							key={stars}
							className="flex items-center gap-3 text-sm tabular-nums"
						>
							<span className="flex w-8 items-center gap-1 font-medium text-gray-900">
								{stars}
								<Star
									aria-hidden
									className="size-3 fill-current text-gray-400"
								/>
							</span>
							<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-foreground"
									style={{ width: `${(count / reviewCount) * 100}%` }}
								/>
							</div>
							<span className="w-8 text-right text-muted-foreground">
								{count}
							</span>
						</li>
					))}
				</ul>
			</div>

			<ul className="mt-8 divide-y border-t">
				{reviews.map((review) => (
					<ReviewItem key={review.id} review={review} />
				))}
			</ul>
		</>
	);
}

function ReviewItem({ review }: { review: ListingReview }) {
	const { firstName, lastName } = review.reviewer;
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

	return (
		<li className="flex gap-4 py-6">
			<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold tracking-wide text-background">
				{initials}
			</div>
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
					<div className="flex items-center gap-2">
						<p className="font-semibold text-gray-900">
							{firstName} {lastName.charAt(0)}.
						</p>
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<BadgeCheck aria-hidden className="size-3.5" />
							Verified buyer
						</span>
					</div>
					<time
						dateTime={review.createdAt.toISOString()}
						className="text-xs text-muted-foreground tabular-nums"
					>
						{reviewDateFormatter.format(review.createdAt)}
					</time>
				</div>
				<RatingStars rating={review.rating} starClassName="size-3.5" />
				<p className="whitespace-pre-line leading-relaxed text-gray-700 text-pretty">
					{review.comment}
				</p>
			</div>
		</li>
	);
}

function EmptyReviews() {
	return (
		<div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
			<RatingStars rating={0} starClassName="size-6" />
			<div className="space-y-1.5">
				<h3 className="text-lg font-semibold text-gray-900">No reviews yet</h3>
				<p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
					Only buyers whose order has been delivered can review this listing.
					Their ratings will show up here.
				</p>
			</div>
		</div>
	);
}

function ReviewSectionSkeleton() {
	return (
		<div
			aria-hidden
			className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-12"
		>
			<div className="space-y-3">
				<div className="h-14 w-28 rounded-lg bg-muted animate-pulse" />
				<div className="h-5 w-32 rounded-full bg-muted animate-pulse" />
			</div>
			<div className="space-y-3">
				{[1, 2, 3, 4, 5].map((row) => (
					<div key={row} className="h-2 rounded-full bg-muted animate-pulse" />
				))}
			</div>
		</div>
	);
}

export default ReviewSection;
