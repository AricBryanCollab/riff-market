import Button from "@/components/button";
import Counter from "@/components/counter";
import type { CartItem } from "@/types/cart";

interface CartCardProps {
	cartItem: CartItem;
	handleRemoveItem: (id: string) => void;
	handleQuantityChange: (quantity: number, productId: string) => void;
}

const CartCard = ({
	cartItem,
	handleRemoveItem,
	handleQuantityChange,
}: CartCardProps) => {
	const { product, quantity, productId } = cartItem;

	return (
		<div className="flex flex-col rounded-xl bg-background/90 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
			<div className="relative mb-4 h-40 rounded-lg bg-slate-200 overflow-hidden">
				<img
					src={product?.images[0]}
					alt={product?.name}
					className="w-full h-full object-cover"
				/>
			</div>

			<div className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">
				{product?.brand}
			</div>

			<div className="text-sm font-semibold text-black line-clamp-2 mb-3">
				{product?.name}
			</div>

			<div className="flex items-center justify-between mb-3">
				<span className="text-lg font-bold text-primary">
					${product?.price.toLocaleString()}
				</span>
				<span className="text-xs text-slate-500">Qty: {quantity}</span>
			</div>

			<div className="flex flex-col justify-between gap-4">
				<Counter
					inputId="quantity"
					label="Quantity"
					value={quantity}
					min={1}
					showLimit={false}
					onChange={(newQuantity) =>
						handleQuantityChange(newQuantity, productId)
					}
				/>
				<Button action={() => handleRemoveItem(productId)} variant="danger">
					Remove
				</Button>
			</div>
		</div>
	);
};

export default CartCard;
