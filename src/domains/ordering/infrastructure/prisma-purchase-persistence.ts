import type { Purchase } from "@/domains/ordering/domain/purchase";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

export async function savePurchaseWithPrisma(
	context: PrismaTransactionContext,
	purchase: Purchase,
) {
	await context.purchase.create({
		data: {
			id: purchase.id,
			customerId: purchase.customerId,
			customerIdSnapshot: purchase.customerId,
			purchaseNumber: purchase.purchaseNumber,
			totalAmountCents: purchase.total.amountMinor,
			currencyCode: purchase.total.currencyCode,
			paymentStatus: purchase.paymentStatus,
			status: purchase.status,
			buyerName: purchase.buyerSnapshot.buyerName,
			buyerEmail: purchase.buyerSnapshot.buyerEmail,
			buyerPhone: purchase.buyerSnapshot.buyerPhone,
			shippingAddress: purchase.buyerSnapshot.shippingAddress,
		},
	});
}
