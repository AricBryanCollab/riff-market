import { randomUUID } from "node:crypto";

import type { PurchaseEntityIdGeneratorPort } from "@/domains/ordering/application/place-purchase";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

export class NodePurchaseEntityIdGenerator
	implements PurchaseEntityIdGeneratorPort<PrismaTransactionContext>
{
	async generate(_context: PrismaTransactionContext) {
		return randomUUID();
	}
}
