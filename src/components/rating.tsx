import { Star } from "lucide-react";

const Rating = () => {
	const avgRating = 4.2;
	const reviewCount = 156;

	return (
		<>
			{/* RATING */}
			<div className="flex items-center gap-3 pb-4 border-b">
				<div className="flex gap-1">
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							size={20}
							className={
								star <= Math.round(avgRating)
									? "fill-yellow-400 text-yellow-400"
									: "fill-gray-200 text-gray-200"
							}
						/>
					))}
				</div>
				<span className="text-sm text-gray-600">
					{avgRating} ({reviewCount} reviews)
				</span>
			</div>
		</>
	);
};

export default Rating;
