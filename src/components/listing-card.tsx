import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import type { ListingReadDto } from "@/domains/listings/dto/listing-read-model";
import { formatMoneyAmountMinor } from "@/utils/format-money";

interface ListingCardProps {
	listing: ListingReadDto;
	onClick?: () => void;
}

const ListingCard = ({ listing, onClick }: ListingCardProps) => {
	const isOutOfStock = listing.stock === 0;
	const isLowStock = listing.stock > 0 && listing.stock <= 3;
	const sellerName = `${listing.seller.firstName} ${listing.seller.lastName}`;

	return (
		<Card className="flex flex-col max-h-125 hover:shadow-lg transition-shadow duration-200 group">
			<CardHeader className="p-0">
				<Link
					to="/listing/$id"
					params={{ id: listing.id }}
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
							listing.images[0]?.url ||
							"https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400"
						}
						alt={listing.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>

					{isOutOfStock && (
						<div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
							Out of Stock
						</div>
					)}
					{isLowStock && (
						<div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
							{listing.stock} left
						</div>
					)}
				</Link>
			</CardHeader>

			<CardContent className="flex-1 p-4 flex flex-col">
				{/* Brand */}
				<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
					{listing.brand}
				</div>

				{/* Listing Name  */}
				<Link
					to="/listing/$id"
					params={{ id: listing.id }}
					className="text-sm font-semibold text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors min-h-10"
					onClick={(e) => {
						if (onClick) {
							e.preventDefault();
							onClick();
						}
					}}
				>
					{listing.name}
				</Link>

				{/* Model */}
				<div className="text-xs text-muted-foreground mb-3 line-clamp-1">
					{listing.model}
				</div>

				{/* Seller Info */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<User className="size-3.5 shrink-0" />
					<span className="truncate">By {sellerName}</span>
				</div>
			</CardContent>

			<CardFooter className="p-4 pt-0 flex flex-col gap-3">
				{/* Price and Stock */}
				<div className="flex items-center w-full justify-between">
					<span className="text-lg font-bold text-primary">
						{formatMoneyAmountMinor(
							listing.priceAmountMinor,
							listing.currencyCode,
						)}
					</span>
					{!isOutOfStock && (
						<span className="text-xs text-muted-foreground">
							{listing.stock} in stock
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
						to="/listing/$id"
						params={{ id: listing.id }}
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

export default ListingCard;
