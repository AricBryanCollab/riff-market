import type { Prisma, PrismaClient } from "generated/prisma/client";

import {
	type BuyerPurchaseHistoryPort,
	deriveBuyerOrderSummaryStatus,
	type OrderDetailReadPort,
	type SellerOrderDashboardPort,
} from "@/domains/ordering/application/order-read-models";
import type {
	OrderingOrderItemReadModel,
	OrderingOrderReadModel,
} from "@/domains/ordering/dto/order-read-model";
import { requireCurrencyPolicy } from "@/domains/shared/domain/currency";

type OrderingReadPrisma = Pick<PrismaClient, "purchase" | "sellerOrder">;

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

export class PrismaOrderReadModels
	implements
		BuyerPurchaseHistoryPort,
		SellerOrderDashboardPort,
		OrderDetailReadPort
{
	constructor(private readonly db: OrderingReadPrisma) {}

	async listForCustomer(customerId: string): Promise<OrderingOrderReadModel[]> {
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

		return purchases.map(toBuyerPurchaseHistoryReadModel);
	}

	async listForSeller(sellerId: string): Promise<OrderingOrderReadModel[]> {
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

		return sellerOrders.map(toSellerOrderDashboardReadModel);
	}

	async listAllForAdmin(): Promise<OrderingOrderReadModel[]> {
		const sellerOrders = await this.db.sellerOrder.findMany({
			include: {
				items: true,
				purchase: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return sellerOrders.map(toSellerOrderDashboardReadModel);
	}

	async findPurchaseForCustomer(
		purchaseId: string,
		customerId: string,
	): Promise<OrderingOrderReadModel | null> {
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

		return purchase ? toBuyerPurchaseHistoryReadModel(purchase) : null;
	}

	async findSellerOrderForSeller(
		sellerOrderId: string,
		sellerId: string,
	): Promise<OrderingOrderReadModel | null> {
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

		return sellerOrder ? toSellerOrderDashboardReadModel(sellerOrder) : null;
	}

	async findForAdmin(orderId: string): Promise<OrderingOrderReadModel | null> {
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
			return toBuyerPurchaseHistoryReadModel(purchase);
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

		return sellerOrder ? toSellerOrderDashboardReadModel(sellerOrder) : null;
	}
}

function toBuyerPurchaseHistoryReadModel(
	purchase: PurchaseHistoryRow,
): OrderingOrderReadModel {
	const items = purchase.sellerOrders.flatMap((sellerOrder) =>
		sellerOrder.items.map((item) => toOrderItemReadModel(sellerOrder.id, item)),
	);

	return {
		id: purchase.id,
		purchaseId: purchase.id,
		orderDate: purchase.createdAt,
		totalAmount: minorAmountToDecimal(
			purchase.totalAmountCents,
			purchase.currencyCode,
		),
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

function toSellerOrderDashboardReadModel(
	sellerOrder: SellerOrderDashboardRow,
): OrderingOrderReadModel {
	const customerName = splitName(sellerOrder.purchase.buyerName);

	return {
		id: sellerOrder.id,
		purchaseId: sellerOrder.purchaseId,
		sellerOrderId: sellerOrder.id,
		orderDate: sellerOrder.createdAt,
		totalAmount: minorAmountToDecimal(
			sellerOrder.subtotalCents,
			sellerOrder.currencyCode,
		),
		shippingAddress: sellerOrder.purchase.shippingAddress,
		trackingNumber:
			sellerOrder.trackingNumber ?? sellerOrder.purchase.purchaseNumber,
		status: sellerOrder.status,
		items: sellerOrder.items.map((item) =>
			toOrderItemReadModel(sellerOrder.id, item),
		),
		customer: {
			id: sellerOrder.purchase.customerIdSnapshot,
			email: sellerOrder.purchase.buyerEmail,
			firstName: customerName.firstName,
			lastName: customerName.lastName,
		},
	};
}

function toOrderItemReadModel(
	orderId: string,
	item: SellerOrderItemRow,
): OrderingOrderItemReadModel {
	const sellerName = splitName(item.sellerDisplayName);

	return {
		id: item.id,
		orderId,
		listingId: item.listingId,
		quantity: item.quantity,
		unitPrice: minorAmountToDecimal(item.unitPriceCents, item.currencyCode),
		subTotal: minorAmountToDecimal(item.subTotalCents, item.currencyCode),
		listing: {
			id: item.listingId,
			name: item.listingName,
			images: item.primaryImageUrl ? [item.primaryImageUrl] : [],
			price: minorAmountToDecimal(item.unitPriceCents, item.currencyCode),
			seller: {
				id: item.sellerId,
				firstName: sellerName.firstName,
				lastName: sellerName.lastName,
				email: "",
			},
		},
	};
}

function minorAmountToDecimal(amountMinor: number, currencyCode: string) {
	const policy = requireCurrencyPolicy(currencyCode);

	return amountMinor / 10 ** policy.minorUnitDigits;
}

function splitName(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const [firstName = ""] = parts;

	return {
		firstName,
		lastName: parts.slice(1).join(" "),
	};
}
