import type { Prisma, PrismaClient } from "generated/prisma/client";

import type { UnitOfWork } from "@/domains/shared/application/unit-of-work";

export type TransactionCapablePrisma = Pick<PrismaClient, "$transaction">;

export type PrismaTransactionContext = Prisma.TransactionClient;

export class PrismaUnitOfWork implements UnitOfWork<PrismaTransactionContext> {
	constructor(private readonly db: TransactionCapablePrisma) {}

	runInTransaction<TResult>(
		handler: (context: PrismaTransactionContext) => Promise<TResult>,
	): Promise<TResult> {
		return this.db.$transaction((tx) => handler(tx));
	}
}
