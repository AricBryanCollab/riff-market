import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const orderSummaryContentVariants = cva("", {
	variants: {
		isMobile: {
			true: "space-y-3",
			false: "space-y-4",
		},
	},
	defaultVariants: {
		isMobile: false,
	},
});

const orderSummarySeparatorVariants = cva("", {
	variants: {
		isMobile: {
			true: "my-2",
			false: "my-3",
		},
	},
	defaultVariants: {
		isMobile: false,
	},
});

const orderSummaryTotalRowVariants = cva("flex justify-between font-semibold", {
	variants: {
		isMobile: {
			true: "text-lg",
			false: "text-lg pt-2",
		},
	},
	defaultVariants: {
		isMobile: false,
	},
});

interface OrderSummaryProps {
	subtotal: number;
	tax?: number;
	shipping?: number;
	showBenefits?: boolean;
	isLoading?: boolean;
	className?: string;
	isMobile?: boolean;
}

export const OrderSummary = ({
	subtotal,
	tax,
	shipping = 0,
	showBenefits = true,
	isLoading = false,
	className = "",
	isMobile = false,
}: OrderSummaryProps) => {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	const calculateTotal = () => {
		const taxAmount = tax ?? 0;
		return subtotal + taxAmount + shipping;
	};

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Order Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Separator />
					<Skeleton className="h-6 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Order Summary</CardTitle>
			</CardHeader>
			<CardContent className={orderSummaryContentVariants({ isMobile })}>
				<div className="space-y-3">
					{/* Subtotal */}
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span className="font-medium">{formatCurrency(subtotal)}</span>
					</div>

					{/* Shipping */}
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Shipping</span>
						{shipping === 0 ? (
							<span className="text-green-600 font-semibold">FREE</span>
						) : (
							<span className="font-medium">{formatCurrency(shipping)}</span>
						)}
					</div>

					{/* Tax */}
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Tax</span>
						{tax !== undefined ? (
							<span className="font-medium">{formatCurrency(tax)}</span>
						) : (
							<span className="text-xs text-muted-foreground">
								Calculated at checkout
							</span>
						)}
					</div>

					<Separator className={orderSummarySeparatorVariants({ isMobile })} />

					{/* Total */}
					<div className={orderSummaryTotalRowVariants({ isMobile })}>
						<span>Total</span>
						<span className="text-primary">
							{formatCurrency(calculateTotal())}
						</span>
					</div>
				</div>

				{showBenefits && !isMobile && (
					<>
						<Separator />
						<div className="pt-2 space-y-2">
							<div className="flex items-start gap-2 text-xs text-muted-foreground">
								<span className="text-green-600 text-sm shrink-0">✓</span>
								<span>Free shipping on all orders</span>
							</div>
							<div className="flex items-start gap-2 text-xs text-muted-foreground">
								<span className="text-green-600 text-sm shrink-0">✓</span>
								<span>Secure payment processing</span>
							</div>
							<div className="flex items-start gap-2 text-xs text-muted-foreground">
								<span className="text-green-600 text-sm shrink-0">✓</span>
								<span>30-day return policy</span>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default OrderSummary;
