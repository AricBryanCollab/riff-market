import { cva } from "class-variance-authority";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const ratingStarVariants = cva("size-6", {
	variants: {
		state: {
			filled: "fill-yellow-400 text-yellow-400",
			empty: "fill-gray-200 text-gray-200",
		},
	},
	defaultVariants: {
		state: "empty",
	},
});

const ReviewSection = () => {
	const avgRating = 4.2;
	const reviewCount = 156;
	const roundedAvgRating = Math.round(avgRating);

	return (
		<div>
			{/* REVIEWS SECTION */}
			<div className="rounded-2xl bg-white p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-8">
					Customer Reviews
				</h2>

				{/* REVIEW SUMMARY */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
					<div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
						<div className="text-5xl font-bold text-gray-900 mb-3">
							{avgRating}
						</div>
						<div className="flex gap-1 mb-2">
							{[1, 2, 3, 4, 5].map((star) => (
								<Star
									key={star}
									className={cn(
										ratingStarVariants({
											state: star <= roundedAvgRating ? "filled" : "empty",
										}),
									)}
								/>
							))}
						</div>
						<p className="text-sm text-gray-500">{reviewCount} reviews</p>
					</div>

					<div className="col-span-2 space-y-3">
						{[5, 4, 3, 2, 1].map((stars) => (
							<div key={stars} className="flex items-center gap-3">
								<span className="text-sm font-medium text-gray-700 w-8">
									{stars}★
								</span>
								<div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-yellow-400"
										style={{ width: `${Math.random() * 70 + 10}%` }}
									/>
								</div>
								<span className="text-sm text-gray-500 w-12">
									{Math.floor(Math.random() * 50)}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* INDIVIDUAL REVIEWS  */}
				<div className="space-y-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className="border rounded-xl p-6 bg-slate-50">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<div className="flex gap-1">
											<div className="h-4 w-4 rounded bg-yellow-300" />
											<div className="h-4 w-4 rounded bg-yellow-300" />
											<div className="h-4 w-4 rounded bg-yellow-300" />
											<div className="h-4 w-4 rounded bg-yellow-300" />
											<div className="h-4 w-4 rounded bg-slate-200" />
										</div>
										<div className="h-4 w-24 rounded bg-slate-300" />
									</div>
									<div className="h-3 w-40 rounded bg-slate-200" />
								</div>
							</div>
							<div className="space-y-2">
								<div className="h-4 w-full rounded bg-slate-200" />
								<div className="h-4 w-full rounded bg-slate-200" />
								<div className="h-4 w-2/3 rounded bg-slate-200" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ReviewSection;
