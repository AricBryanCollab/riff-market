import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import OrderItemCard from "@/components/order/orderitemcard";
import OrderSummary from "@/components/order/ordersummary";
import PaymentMethodSelect from "@/components/order/paymentmethodselect";
import ShippingAddressField from "@/components/order/shippingaddressfield";
import SectionContainer from "@/components/sectioncontainer";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { H2 } from "@/components/ui/typography";
import useCartDetails from "@/hooks/useCartDetails";
import usePlaceOrder from "@/hooks/usePlaceOrder";

export const Route = createFileRoute("/checkout")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const { isLoading: isLoadingCart, cartWithDetails } = useCartDetails();
	const {
		shippingAddress,
		paymentMethod,
		address: defaultAddress,
		clearAddress,
		handleDefaultAddress,
		handleShippingAddressChange,
		handlePaymentMethodChange,
		handleSubmit,
	} = usePlaceOrder();

	const calculateSubtotal = () => {
		if (!cartWithDetails || cartWithDetails.length === 0) return 0;
		return cartWithDetails.reduce(
			(total, item) => total + (item.product?.price || 0) * item.quantity,
			0,
		);
	};

	const calculateTax = () => {
		return calculateSubtotal() * 0.08;
	};

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
							cartWithDetails={cartWithDetails}
						/>

						<ShippingAddressField
							value={shippingAddress}
							onChange={handleShippingAddressChange}
							clearAddress={clearAddress}
							disabled={!defaultAddress}
							setDefaultAddress={handleDefaultAddress}
						/>

						<PaymentMethodSelect
							value={paymentMethod}
							onValueChange={handlePaymentMethodChange}
						/>

						<div className="lg:hidden">
							<OrderSummary
								subtotal={calculateSubtotal()}
								tax={calculateTax()}
								shipping={0}
								showBenefits={false}
								isLoading={isLoadingCart}
								isMobile={true}
							/>
						</div>

						<div className="flex flex-col w-full">
							<LoadingButton
								loading={isLoadingCart}
								type="submit"
								disabled={false}
								className="w-full sm:w-auto"
							>
								Place Order
							</LoadingButton>
						</div>
					</form>
				</div>

				<div className="hidden lg:block">
					<OrderSummary
						subtotal={calculateSubtotal()}
						tax={calculateTax()}
						shipping={0}
						showBenefits
						isLoading={isLoadingCart}
						className="sticky top-6"
					/>
				</div>
			</div>
		</SectionContainer>
	);
}
