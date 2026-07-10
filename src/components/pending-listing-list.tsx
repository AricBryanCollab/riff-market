import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Package } from "lucide-react";
import AnimatedLoader from "@/components/animated-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BodySmall, H5 } from "@/components/ui/typography";
import type { ListingResponse } from "@/domains/listings/dto/listing-view";
import { formatRelativeTime } from "@/utils/format-date";
import { formatMoneyAmountMinor } from "@/utils/format-money";

interface PendingListingListProps {
	pendingListings: ListingResponse[];
	pendingListingCount: number;
	isLoading: boolean;
	isEmptyPendingListings: boolean;
}

const PendingListingList = ({
	pendingListings,
	pendingListingCount,
	isLoading,
	isEmptyPendingListings,
}: PendingListingListProps) => {
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
				{!isEmptyPendingListings && (
					<BodySmall className="text-muted-foreground mt-0.5">
						{pendingListingCount}{" "}
						{pendingListingCount === 1 ? "listing" : "listings"} awaiting
						approval
					</BodySmall>
				)}
			</div>

			<div className="max-h-96 overflow-y-auto px-4 py-3">
				{isEmptyPendingListings && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-3">
							<Package className="size-8 text-muted-foreground" />
						</div>
						<BodySmall className="text-muted-foreground">
							No pending listings
						</BodySmall>
						<BodySmall className="text-muted-foreground/70 text-xs mt-1">
							All your listings have been reviewed
						</BodySmall>
					</div>
				)}

				{!isEmptyPendingListings && (
					<ul className="space-y-2">
						{pendingListings.slice(0, 5).map((listing) => (
							<li
								key={listing.id}
								className="p-3 rounded-lg transition-colors hover:bg-accent/50 border border-border"
							>
								<div className="flex gap-3">
									{/* Listing Image */}
									{listing.images?.[0] && (
										<div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
											<img
												src={listing.images[0].url}
												alt={listing.name}
												className="w-full h-full object-cover"
											/>
										</div>
									)}

									{/* Listing Details */}
									<div className="flex-1 min-w-0 space-y-1.5">
										<div className="flex items-start justify-between gap-2">
											<h6 className="text-sm font-medium text-foreground truncate">
												{listing.name}
											</h6>
											<Badge className="flex items-center px-1 py-0.5 rounded-md text-xs shrink-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
												<Clock className="size-3 mr-1" />
												Pending
											</Badge>
										</div>

										<div className="space-y-0.5">
											<p className="text-xs text-muted-foreground truncate">
												{listing.brand} • {listing.model}
											</p>
											<p className="text-xs text-muted-foreground">
												{listing.category}
											</p>
										</div>

										<div className="flex items-center justify-between pt-0.5">
											<span className="text-sm font-semibold text-foreground">
												{formatMoneyAmountMinor(
													listing.priceAmountMinor,
													listing.currencyCode,
												)}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(listing?.createdAt || "NaN")}
											</span>
										</div>
									</div>
								</div>
							</li>
						))}

						{pendingListingCount > 5 && (
							<div className="text-center pt-2 pb-1">
								<BodySmall className="text-muted-foreground/80 text-xs">
									+{pendingListingCount - 5} more{" "}
									{pendingListingCount - 5 === 1 ? "listing" : "listings"}
								</BodySmall>
							</div>
						)}
					</ul>
				)}
			</div>

			{!isEmptyPendingListings && (
				<div className="px-4 py-3 border-t border-border bg-muted/30">
					<Button variant="ghost" className="w-full text-sm group">
						<Link
							to="/shop"
							className="flex items-center justify-center gap-2 w-full"
						>
							<span>View All Pending Listings</span>
							<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
};

export default PendingListingList;
