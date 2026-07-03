import type { Prisma, PrismaClient } from "generated/prisma/client";

import {
	type BuyerPurchaseHistoryPort,
	deriveBuyerOrderSummaryStatus,
	type OrderDetailQueryPort,
	type SellerOrderDashboardPort,
} from "@/domains/ordering/application/order-queries";
import type {
	BuyerPurchaseView,
	OrderItemView,
	OrderView,
	SellerOrderView,
} from "@/domains/ordering/dto/order-view";

type OrderQueryPrisma = Pick<PrismaClient, "purchase" | "sellerOrder">;

type PurchaseHistoryRow = Prisma.PurchaseGetPayload<{
	include: {
		sellerOrders: {
			include: {
				items: true;
			};
		};
	};
}>;

type SellerOrderDashboardRow = Prisma.SellerOrderGetPayload<{
	include: {
		items: true;
		purchase: true;
	};
}>;

type SellerOrderItemRow =
	PurchaseHistoryRow["sellerOrders"][number]["items"][number];

export class PrismaOrderQueries
	implements
		BuyerPurchaseHistoryPort,
		SellerOrderDashboardPort,
		OrderDetailQueryPort
{
	constructor(private readonly db: OrderQueryPrisma) {}

	async listForCustomer(customerId: string): Promise<BuyerPurchaseView[]> {
		const purchases = await this.db.purchase.findMany({
			where: {
				customerIdSnapshot: customerId,
			},
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
					orderBy: {
						createdAt: "asc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return purchases.map(toBuyerPurchaseHistoryView);
	}

	async listForSeller(sellerId: string): Promise<SellerOrderView[]> {
		const sellerOrders = await this.db.sellerOrder.findMany({
			where: {
				sellerIdSnapshot: sellerId,
			},
			include: {
				items: true,
				purchase: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return sellerOrders.map(toSellerOrderDashboardView);
	}

	async listAllForAdmin(): Promise<SellerOrderView[]> {
		const sellerOrders = await this.db.sellerOrder.findMany({
			include: {
				items: true,
				purchase: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return sellerOrders.map(toSellerOrderDashboardView);
	}

	async findPurchaseForCustomer(
		purchaseId: string,
		customerId: string,
	): Promise<BuyerPurchaseView | null> {
		const purchase = await this.db.purchase.findFirst({
			where: {
				id: purchaseId,
				customerIdSnapshot: customerId,
			},
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		return purchase ? toBuyerPurchaseHistoryView(purchase) : null;
	}

	async findSellerOrderForSeller(
		sellerOrderId: string,
		sellerId: string,
	): Promise<SellerOrderView | null> {
		const sellerOrder = await this.db.sellerOrder.findFirst({
			where: {
				id: sellerOrderId,
				sellerIdSnapshot: sellerId,
			},
			include: {
				items: true,
				purchase: true,
			},
		});

		return sellerOrder ? toSellerOrderDashboardView(sellerOrder) : null;
	}

	async findForAdmin(orderId: string): Promise<OrderView | null> {
		const purchase = await this.db.purchase.findUnique({
			where: {
				id: orderId,
			},
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		if (purchase) {
			return toBuyerPurchaseHistoryView(purchase);
		}

		const sellerOrder = await this.db.sellerOrder.findUnique({
			where: {
				id: orderId,
			},
			include: {
				items: true,
				purchase: true,
			},
		});

		return sellerOrder ? toSellerOrderDashboardView(sellerOrder) : null;
	}
}

function toBuyerPurchaseHistoryView(
	purchase: PurchaseHistoryRow,
): BuyerPurchaseView {
	const items = purchase.sellerOrders.flatMap((sellerOrder) =>
		sellerOrder.items.map((item) => toOrderItemView(sellerOrder.id, item)),
	);

	return {
		kind: "buyer-purchase",
		id: purchase.id,
		purchaseId: purchase.id,
		orderDate: purchase.createdAt,
		totalAmountMinor: purchase.totalAmountCents,
		currencyCode: purchase.currencyCode,
		shippingAddress: purchase.shippingAddress,
		trackingNumber: purchase.purchaseNumber,
		status: deriveBuyerOrderSummaryStatus({
			purchaseStatus: purchase.status,
			paymentStatus: purchase.paymentStatus,
			sellerOrderStatuses: purchase.sellerOrders.map(
				(sellerOrder) => sellerOrder.status,
			),
		}),
		items,
	};
}

function toSellerOrderDashboardView(
	sellerOrder: SellerOrderDashboardRow,
): SellerOrderView {
	const customerName = splitName(sellerOrder.purchase.buyerName);

	return {
		kind: "seller-order",
		id: sellerOrder.id,
		purchaseId: sellerOrder.purchaseId,
		sellerOrderId: sellerOrder.id,
		orderDate: sellerOrder.createdAt,
		totalAmountMinor: sellerOrder.subtotalCents,
		currencyCode: sellerOrder.currencyCode,
		shippingAddress: sellerOrder.purchase.shippingAddress,
		trackingNumber:
			sellerOrder.trackingNumber ?? sellerOrder.purchase.purchaseNumber,
		status: sellerOrder.status,
		items: sellerOrder.items.map((item) =>
			toOrderItemView(sellerOrder.id, item),
		),
		customer: {
			id: sellerOrder.purchase.customerIdSnapshot,
			email: sellerOrder.purchase.buyerEmail,
			firstName: customerName.firstName,
			lastName: customerName.lastName,
		},
	};
}

function toOrderItemView(
	orderId: string,
	item: SellerOrderItemRow,
): OrderItemView {
	const sellerName = splitName(item.sellerDisplayName);

	return {
		id: item.id,
		orderId,
		listingId: item.listingId,
		quantity: item.quantity,
		unitPriceAmountMinor: item.unitPriceCents,
		subTotalAmountMinor: item.subTotalCents,
		currencyCode: item.currencyCode,
		listing: {
			id: item.listingId,
			name: item.listingName,
			images: item.primaryImageUrl ? [item.primaryImageUrl] : [],
			priceAmountMinor: item.unitPriceCents,
			currencyCode: item.currencyCode,
			seller: {
				id: item.sellerId,
				firstName: sellerName.firstName,
				lastName: sellerName.lastName,
				email: "",
			},
		},
	};
}

function splitName(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const [firstName = ""] = parts;

	return {
		firstName,
		lastName: parts.slice(1).join(" "),
	};
}
