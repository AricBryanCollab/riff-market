import type { SellerOrderPersistencePort } from "@/domains/ordering/application/place-purchase";
import type { SellerOrder } from "@/domains/ordering/domain/seller-order";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

export class PrismaSellerOrderPersistence
	implements SellerOrderPersistencePort<PrismaTransactionContext>
{
	async saveMany(
		context: PrismaTransactionContext,
		sellerOrders: SellerOrder[],
	) {
		for (const sellerOrder of sellerOrders) {
			await context.sellerOrder.create({
				data: {
					id: sellerOrder.id,
					purchaseId: sellerOrder.purchaseId,
					sellerId: sellerOrder.sellerId,
					sellerIdSnapshot: sellerOrder.sellerId,
					subtotalCents: sellerOrder.subtotal.amountMinor,
					currencyCode: sellerOrder.subtotal.currencyCode,
					status: sellerOrder.status,
					trackingNumber: sellerOrder.trackingNumber,
					items: {
						create: sellerOrder.items.map((item) => ({
							listingId: item.listingId,
							listingName: item.listingName,
							brand: item.brand,
							model: item.model,
							category: item.category,
							condition: item.condition,
							primaryImageUrl: item.primaryImageUrl,
							sellerId: item.sellerId,
							sellerDisplayName: item.sellerDisplayName,
							unitPriceCents: item.unitPriceCents,
							quantity: item.quantity,
							subTotalCents: item.subTotalCents,
							currencyCode: item.currencyCode,
						})),
					},
				},
			});
		}
	}
}
