import { Link } from "@tanstack/react-router";
import MusicNote from "@/assets/music-note";
import ConditionBadge from "@/components/home/condition-badge";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { formatMoneyAmountMinor } from "@/utils/format-money";

interface FeaturedListingCardProps {
	listing: ListingReadDto;
}

const FeaturedListingCard = ({ listing }: FeaturedListingCardProps) => {
	return (
		<Link
			to="/listing/$id"
			params={{ id: listing.id }}
			className="group block rounded-xl overflow-hidden border border-border hover:border-foreground transition-colors"
		>
			<div className="relative aspect-square bg-muted">
				<div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
					<MusicNote size={16} />
				</div>
				<ConditionBadge condition={listing.condition} />
			</div>

			<div className="p-4">
				<p className="text-sm text-muted-foreground">
					{listing.brand} · {listing.model}
				</p>
				<h3 className="font-medium text-foreground mt-1 line-clamp-1">
					{listing.name}
				</h3>
				<p className="text-lg font-semibold text-foreground mt-2">
					{formatMoneyAmountMinor(
						listing.priceAmountMinor,
						listing.currencyCode,
					)}
				</p>
			</div>
		</Link>
	);
};

export default FeaturedListingCard;
