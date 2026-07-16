import type { Prisma, PrismaClient } from "generated/prisma/client";

import type {
	SellerOrderStatusChangeRecord,
	SellerOrderStatusRepositoryPort,
} from "@/domains/ordering/application/change-seller-order-status";
import {
	SellerOrder,
	type SellerOrderItemSnapshot,
	type SellerOrderStatus,
} from "@/domains/ordering/domain/seller-order";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

type SellerOrderStatusPrisma = Pick<PrismaClient, "sellerOrder">;

type SellerOrderStatusRow = Prisma.SellerOrderGetPayload<{
	include: {
		items: true;
		purchase: {
			select: {
				customerIdSnapshot: true;
			};
		};
	};
}>;

type SellerOrderItemRow = SellerOrderStatusRow["items"][number];

export class PrismaSellerOrderStatusRepository
	implements SellerOrderStatusRepositoryPort<PrismaTransactionContext>
{
	constructor(private readonly db: SellerOrderStatusPrisma) {}

	async findById(
		sellerOrderId: string,
	): Promise<SellerOrderStatusChangeRecord | null> {
		const sellerOrder = await this.db.sellerOrder.findUnique({
			where: {
				id: sellerOrderId,
			},
			include: {
				items: true,
				purchase: {
					select: {
						customerIdSnapshot: true,
					},
				},
			},
		});

		if (!sellerOrder) {
			return null;
		}

		return toStatusChangeRecord(sellerOrder);
	}

	async save(
		context: PrismaTransactionContext,
		sellerOrder: SellerOrder,
		expectedCurrentStatus: SellerOrderStatus,
	) {
		const updateResult = await context.sellerOrder.updateMany({
			where: {
				id: sellerOrder.id,
				status: expectedCurrentStatus,
			},
			data: {
				status: sellerOrder.status,
				trackingNumber: sellerOrder.trackingNumber,
			},
		});

		return updateResult.count === 1;
	}
}

function toStatusChangeRecord(
	sellerOrder: SellerOrderStatusRow,
): SellerOrderStatusChangeRecord {
	return {
		customerId: sellerOrder.purchase.customerIdSnapshot,
		sellerOrder: SellerOrder.reconstitute({
			id: sellerOrder.id,
			purchaseId: sellerOrder.purchaseId,
			sellerId: sellerOrder.sellerIdSnapshot,
			items: sellerOrder.items.map(toSellerOrderItemSnapshot),
			status: sellerOrder.status,
			trackingNumber: sellerOrder.trackingNumber,
		}),
	};
}

function toSellerOrderItemSnapshot(
	item: SellerOrderItemRow,
): SellerOrderItemSnapshot {
	return {
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
	};
}
