import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoneyAmountMinor } from "@/utils/format-money";

type OrderSummaryAmounts = {
	subtotalAmountMinor: number;
	taxAmountMinor?: number;
	shippingAmountMinor?: number;
	currencyCode: string;
};

type OrderSummaryLayout = {
	contentClassName: string;
	separatorClassName: string;
	totalClassName: string;
};

type OrderSummaryFrameProps = {
	className?: string;
	contentClassName: string;
	children: ReactNode;
};

const desktopLayout = {
	contentClassName: "space-y-4",
	separatorClassName: "my-3",
	totalClassName: "text-lg pt-2",
} satisfies OrderSummaryLayout;

const mobileLayout = {
	contentClassName: "space-y-3",
	separatorClassName: "my-2",
	totalClassName: "text-lg",
} satisfies OrderSummaryLayout;

function OrderSummaryFrame({
	className,
	contentClassName,
	children,
}: OrderSummaryFrameProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Order Summary</CardTitle>
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
		</Card>
	);
}

function OrderSummaryBreakdown({
	amounts,
	layout,
}: {
	amounts: OrderSummaryAmounts;
	layout: OrderSummaryLayout;
}) {
	const {
		subtotalAmountMinor,
		taxAmountMinor,
		shippingAmountMinor = 0,
	} = amounts;
	const totalAmountMinor =
		subtotalAmountMinor + (taxAmountMinor ?? 0) + shippingAmountMinor;

	return (
		<div className="space-y-3">
			<OrderSummaryRow label="Subtotal">
				{formatSummaryAmount(subtotalAmountMinor, amounts.currencyCode)}
			</OrderSummaryRow>

			<OrderSummaryRow label="Shipping">
				{shippingAmountMinor === 0 ? (
					<span className="text-green-600 font-semibold">FREE</span>
				) : (
					formatSummaryAmount(shippingAmountMinor, amounts.currencyCode)
				)}
			</OrderSummaryRow>

			{taxAmountMinor !== undefined && (
				<OrderSummaryRow label="Tax">
					{formatSummaryAmount(taxAmountMinor, amounts.currencyCode)}
				</OrderSummaryRow>
			)}

			<Separator className={layout.separatorClassName} />

			<div
				className={cn(
					"flex justify-between font-semibold",
					layout.totalClassName,
				)}
			>
				<span>Total</span>
				<span className="text-primary">
					{formatSummaryAmount(totalAmountMinor, amounts.currencyCode)}
				</span>
			</div>
		</div>
	);
}

function OrderSummaryRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex justify-between text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium">{children}</span>
		</div>
	);
}

function OrderSummaryBenefits() {
	return (
		<div className="pt-2 space-y-2">
			<OrderSummaryBenefit>Free shipping on all orders</OrderSummaryBenefit>
			<OrderSummaryBenefit>Secure payment processing</OrderSummaryBenefit>
			<OrderSummaryBenefit>30-day return policy</OrderSummaryBenefit>
		</div>
	);
}

function OrderSummaryBenefit({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-start gap-2 text-xs text-muted-foreground">
			<span className="text-green-600 text-sm shrink-0">✓</span>
			<span>{children}</span>
		</div>
	);
}

function formatSummaryAmount(amountMinor: number, currencyCode: string) {
	return formatMoneyAmountMinor(amountMinor, currencyCode);
}

export function DesktopOrderSummary({
	className,
	...amounts
}: OrderSummaryAmounts & { className?: string }) {
	return (
		<OrderSummaryFrame
			className={className}
			contentClassName={desktopLayout.contentClassName}
		>
			<OrderSummaryBreakdown amounts={amounts} layout={desktopLayout} />
			<Separator />
			<OrderSummaryBenefits />
		</OrderSummaryFrame>
	);
}

export function MobileOrderSummary(amounts: OrderSummaryAmounts) {
	return (
		<OrderSummaryFrame contentClassName={mobileLayout.contentClassName}>
			<OrderSummaryBreakdown amounts={amounts} layout={mobileLayout} />
		</OrderSummaryFrame>
	);
}

export function OrderSummaryLoading({ className }: { className?: string }) {
	return (
		<OrderSummaryFrame className={className} contentClassName="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-full" />
			<Separator />
			<Skeleton className="h-6 w-full" />
		</OrderSummaryFrame>
	);
}

export function OrderSummaryUnavailable({
	className,
	message,
}: {
	className?: string;
	message: string;
}) {
	return (
		<OrderSummaryFrame className={className} contentClassName="space-y-3">
			<p className="text-sm text-muted-foreground">{message}</p>
		</OrderSummaryFrame>
	);
}
