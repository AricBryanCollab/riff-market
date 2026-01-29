import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, MapPin, Package } from "lucide-react";
import { FormTextArea } from "@/components/form-textarea";
import { SearchableSelect } from "@/components/searchable-select";
import SectionContainer from "@/components/sectioncontainer";
import { H2 } from "@/components/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { Separator } from "@/components/ui/separator";
import { paymentMethodOptions } from "@/constants/selectOptions";
import useCartDetails from "@/hooks/useCartDetails";

export const Route = createFileRoute("/checkout")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const { isLoading: isLoadingCart, cartWithDetails } = useCartDetails();

	return (
		<SectionContainer>
			<div className="my-6 relative flex items-center justify-center">
				<div className="absolute left-0 flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate({ to: "/cart" })}
						className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted-foreground transition-colors hover:bg-foreground hover:text-white"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="hidden md:block">Back to Cart</p>
				</div>
				<H2>Order Checkout</H2>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
				{/* Main Form Section */}
				<div className="lg:col-span-2">
					<form onSubmit={() => {}} className="space-y-6">
						{/* Order Items Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="w-5 h-5" />
									Order Items
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isLoadingCart ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
									</div>
								) : cartWithDetails.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">
										Your cart is empty
									</p>
								) : (
									<div className="space-y-4">
										{cartWithDetails.map((item) => (
											<div
												key={item.product?.id}
												className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
											>
												<div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
													<Package className="w-8 h-8 text-muted-foreground" />
												</div>
												<div className="flex-1">
													<h4 className="font-medium">{item.product?.name}</h4>
													<p className="text-sm text-muted-foreground">
														Quantity: {item.quantity}
													</p>
												</div>
												<div className="text-right">
													<p className="font-semibold">{item.product?.price}</p>
													<p className="text-sm text-muted-foreground">
														{item?.quantity}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Shipping Address Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="w-5 h-5" />
									Shipping Address
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormTextArea
									id="shippingAddress"
									label="Delivery Address"
									value=""
									onChange={() => {}}
									placeholder="Enter your complete delivery address including street, city, state, and postal code"
									rows={4}
								/>
								<div className="flex items-center justify-end w-full gap-3">
									<LoadingButton
										loading={false}
										variant="outline"
										type="button"
										onClick={() => {}}
									>
										Clear
									</LoadingButton>
									<LoadingButton
										disabled={false}
										variant="secondary"
										type="button"
										onClick={() => {}}
									>
										Set Default Address
									</LoadingButton>
								</div>
							</CardContent>
						</Card>

						{/* Payment Method Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CreditCard className="w-5 h-5" />
									Payment Method
								</CardTitle>
							</CardHeader>
							<CardContent>
								<SearchableSelect
									options={paymentMethodOptions.map((p) => ({
										label: p.label,
										value: p.value,
									}))}
									value=""
									onValueChange={() => {}}
									label="Select Payment Method"
								/>
							</CardContent>
						</Card>

						{/* Mobile Order Summary - shown only on mobile */}
						<div className="lg:hidden">
							<Card>
								<CardHeader>
									<CardTitle>Order Summary</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Subtotal</span>
										<span>Total Price here</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Shipping</span>
										<span className="text-green-600">FREE</span>
									</div>
									<Separator />
									<div className="flex justify-between font-semibold text-lg">
										<span>Total</span>
										<span>Total Price Here</span>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Submit Button */}
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

				{/* Order Summary Sidebar - Desktop Only */}
				<div className="hidden lg:block">
					<Card className="sticky top-6">
						<CardHeader>
							<CardTitle>Order Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span>Total Price Here</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Shipping</span>
									<span className="text-green-600 font-medium">FREE</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tax</span>
									<span>Calculated at checkout</span>
								</div>
								<Separator />
								<div className="flex justify-between font-semibold text-lg pt-2">
									<span>Total</span>
									<span className="text-primary">Total Price Here</span>
								</div>
							</div>

							<div className="pt-4 space-y-2">
								<div className="flex items-start gap-2 text-xs text-muted-foreground">
									<span className="text-green-600">✓</span>
									<span>Free shipping on all orders</span>
								</div>
								<div className="flex items-start gap-2 text-xs text-muted-foreground">
									<span className="text-green-600">✓</span>
									<span>Secure payment processing</span>
								</div>
								<div className="flex items-start gap-2 text-xs text-muted-foreground">
									<span className="text-green-600">✓</span>
									<span>30-day return policy</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</SectionContainer>
	);
}
