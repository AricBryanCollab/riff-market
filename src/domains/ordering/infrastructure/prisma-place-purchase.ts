import {
	type PlacePurchaseCommand,
	type PurchaseEntityIdGeneratorPort,
	type PurchaseNumberGeneratorPort,
	type PurchasePlacedNotificationCreatorPort,
	placePurchase,
} from "@/domains/ordering/application/place-purchase";
import { NodePurchaseEntityIdGenerator } from "@/domains/ordering/infrastructure/node-purchase-entity-id-generator";
import { PrismaListingsForPurchase } from "@/domains/ordering/infrastructure/prisma-listings-for-purchase";
import { PrismaPurchaseNumberGenerator } from "@/domains/ordering/infrastructure/prisma-purchase-number-generator";
import { PrismaPurchasePersistence } from "@/domains/ordering/infrastructure/prisma-purchase-persistence";
import { PrismaPurchasePlacedNotificationCreator } from "@/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator";
import { PrismaSellerOrderPersistence } from "@/domains/ordering/infrastructure/prisma-seller-order-persistence";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type PrismaTransactionContext,
	PrismaUnitOfWork,
	type TransactionCapablePrisma,
} from "@/domains/shared/infrastructure/prisma-unit-of-work";

export type CreatePrismaPlacePurchaseOptions = {
	readonly db: TransactionCapablePrisma;
	readonly purchaseNumbers?: PurchaseNumberGeneratorPort<PrismaTransactionContext>;
	readonly entityIds?: PurchaseEntityIdGeneratorPort<PrismaTransactionContext>;
	readonly notifications?: PurchasePlacedNotificationCreatorPort<PrismaTransactionContext>;
};

export function createPrismaPlacePurchase(
	options: CreatePrismaPlacePurchaseOptions,
) {
	const {
		db,
		purchaseNumbers = new PrismaPurchaseNumberGenerator(),
		entityIds = new NodePurchaseEntityIdGenerator(),
		notifications = new PrismaPurchasePlacedNotificationCreator(),
	} = options;

	const dependencies = {
		unitOfWork: new PrismaUnitOfWork(db),
		listings: new PrismaListingsForPurchase(),
		purchases: new PrismaPurchasePersistence(),
		sellerOrders: new PrismaSellerOrderPersistence(),
		purchaseNumbers,
		entityIds,
		notifications,
	};

	return (actor: Actor, command: PlacePurchaseCommand) =>
		placePurchase(actor, command, dependencies);
}
