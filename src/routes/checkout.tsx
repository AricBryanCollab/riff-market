import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import OrderItemCard from "@/components/order/order-item-card";
import {
	DesktopOrderSummary,
	MobileOrderSummary,
	OrderSummaryLoading,
	OrderSummaryUnavailable,
} from "@/components/order/order-summary";
import ShippingAddressField from "@/components/order/shipping-address-field";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { H2 } from "@/components/ui/typography";
import useCartDetails from "@/hooks/use-cart-details";
import usePlaceOrder from "@/hooks/use-place-order";
import { requireRole } from "@/utils/require-role";

export const Route = createFileRoute("/checkout")({
	beforeLoad: async ({ context }) =>
		requireRole(context.queryClient, ["CUSTOMER"]),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const {
		isLoading: isLoadingCart,
		cartLines,
		cartPricing,
		checkoutCart,
	} = useCartDetails();

	const {
		shippingAddress,
		address: defaultAddress,
		isPending: isPlacingOrder,
		clearAddress,
		handleDefaultAddress,
		handleShippingAddressChange,
		handleSubmit,
	} = usePlaceOrder(checkoutCart);

	const canSubmitOrder = checkoutCart.status === "ready";
	const subtotalAmountMinor =
		cartPricing.status === "priced" ? cartPricing.totalPriceAmountMinor : 0;
	const taxAmountMinor =
		cartPricing.status === "priced"
			? Math.round(subtotalAmountMinor * 0.08)
			: undefined;
	const isSubmittingOrder = isLoadingCart || isPlacingOrder;
	const orderSummaryAmounts =
		cartPricing.status === "priced"
			? {
					subtotalAmountMinor,
					taxAmountMinor,
					shippingAmountMinor: 0,
					currencyCode: cartPricing.currencyCode,
				}
			: undefined;
	const orderSummaryUnavailableMessage =
		cartPricing.status === "priced" ? undefined : cartPricing.message;

	return (
		<SectionContainer>
			<div className="my-6 relative flex items-center justify-center">
				<div className="absolute left-0 flex items-center gap-3">
					<Button
						className="rounded-full size-10 cursor-pointer"
						onClick={() => navigate({ to: "/cart" })}
					>
						<ArrowLeft size={32} />
					</Button>
					<p className="hidden md:block">Back to Cart</p>
				</div>
				<H2>Order Checkout</H2>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
				<div className="lg:col-span-2">
					<form onSubmit={handleSubmit} className="space-y-6">
						<OrderItemCard
							isLoadingCart={isLoadingCart}
							cartLines={cartLines}
						/>

						<ShippingAddressField
							value={shippingAddress}
							onChange={handleShippingAddressChange}
							clearAddress={clearAddress}
							disabled={!defaultAddress}
							setDefaultAddress={handleDefaultAddress}
						/>

						<div className="lg:hidden">
							{isLoadingCart ? (
								<OrderSummaryLoading />
							) : orderSummaryAmounts ? (
								<MobileOrderSummary {...orderSummaryAmounts} />
							) : (
								<OrderSummaryUnavailable
									message={orderSummaryUnavailableMessage ?? ""}
								/>
							)}
						</div>

						<div className="flex flex-col w-full">
							<LoadingButton
								loading={isSubmittingOrder}
								disabled={!canSubmitOrder}
								type="submit"
								className="w-full sm:w-auto"
							>
								Place Order
							</LoadingButton>
						</div>
					</form>
				</div>

				<div className="hidden lg:block">
					{isLoadingCart ? (
						<OrderSummaryLoading className="sticky top-6" />
					) : orderSummaryAmounts ? (
						<DesktopOrderSummary
							{...orderSummaryAmounts}
							className="sticky top-6"
						/>
					) : (
						<OrderSummaryUnavailable
							message={orderSummaryUnavailableMessage ?? ""}
							className="sticky top-6"
						/>
					)}
				</div>
			</div>
		</SectionContainer>
	);
}
