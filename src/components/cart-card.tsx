import Counter from "@/components/counter";
import { Button } from "@/components/ui/button";
import type { CartDetail } from "@/types/cart";

interface CartCardProps {
	cartItem: CartDetail;
	handleRemoveItem: (id: string) => void;
	handleQuantityChange: (quantity: number, listingId: string) => void;
}

const CartCard = ({
	cartItem,
	handleRemoveItem,
	handleQuantityChange,
}: CartCardProps) => {
	const { listingId, quantity } = cartItem;
	const isAvailable = cartItem.status === "available";

	return (
		<div className="flex flex-col rounded-xl bg-background/90 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="relative mb-4 h-40 rounded-lg bg-slate-200 overflow-hidden">
				{cartItem.imageUrl && (
					<img
						src={cartItem.imageUrl}
						alt={cartItem.imageAlt}
						className="w-full h-full object-cover"
					/>
				)}
			</div>

			<div className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">
				{cartItem.description}
			</div>

			<div className="text-sm font-semibold text-black line-clamp-2 mb-3">
				{cartItem.title}
			</div>

			<div className="flex items-center justify-between mb-3">
				<span className="text-lg font-bold text-primary">
					{cartItem.unitPriceText}
				</span>
				<span className="text-xs text-slate-500">Qty: {quantity}</span>
			</div>

			<div className="flex flex-col justify-between gap-4">
				<Counter
					inputId="quantity"
					label="Quantity"
					value={quantity}
					min={1}
					max={isAvailable ? cartItem.listing.stock : undefined}
					disabled={!isAvailable}
					showLimit={false}
					onChange={(newQuantity) =>
						handleQuantityChange(newQuantity, listingId)
					}
				/>
				<Button
					onClick={() => handleRemoveItem(listingId)}
					variant="destructive"
				>
					Remove
				</Button>
			</div>
		</div>
	);
};

export default CartCard;
