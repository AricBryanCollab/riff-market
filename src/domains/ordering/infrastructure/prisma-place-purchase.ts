import {
	PlacePurchase,
	type PurchaseNumberGeneratorPort,
	type PurchasePlacedNotificationCreatorPort,
} from "@/domains/ordering/application/place-purchase";
import { PrismaListingsForPurchase } from "@/domains/ordering/infrastructure/prisma-listings-for-purchase";
import { PrismaPurchaseNumberGenerator } from "@/domains/ordering/infrastructure/prisma-purchase-number-generator";
import { PrismaPurchasePersistence } from "@/domains/ordering/infrastructure/prisma-purchase-persistence";
import { PrismaPurchasePlacedNotificationCreator } from "@/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator";
import { PrismaSellerOrderPersistence } from "@/domains/ordering/infrastructure/prisma-seller-order-persistence";
import {
	type PrismaTransactionContext,
	PrismaUnitOfWork,
	type TransactionCapablePrisma,
} from "@/domains/shared/infrastructure/prisma-unit-of-work";

export type CreatePrismaPlacePurchaseOptions = {
	readonly db: TransactionCapablePrisma;
	readonly purchaseNumbers?: PurchaseNumberGeneratorPort<PrismaTransactionContext>;
	readonly notifications?: PurchasePlacedNotificationCreatorPort<PrismaTransactionContext>;
};

export function createPrismaPlacePurchase(
	options: CreatePrismaPlacePurchaseOptions,
) {
	const {
		db,
		purchaseNumbers = new PrismaPurchaseNumberGenerator(),
		notifications = new PrismaPurchasePlacedNotificationCreator(),
	} = options;

	return new PlacePurchase({
		unitOfWork: new PrismaUnitOfWork(db),
		listings: new PrismaListingsForPurchase(),
		purchases: new PrismaPurchasePersistence(),
		sellerOrders: new PrismaSellerOrderPersistence(),
		purchaseNumbers,
		notifications,
	});
}
