import { randomUUID } from "node:crypto";

import type { PurchaseNumberGeneratorPort } from "@/domains/ordering/application/place-purchase";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

export class PrismaPurchaseNumberGenerator
	implements PurchaseNumberGeneratorPort<PrismaTransactionContext>
{
	async generate(_context: PrismaTransactionContext) {
		return `RIFF-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
	}
}
