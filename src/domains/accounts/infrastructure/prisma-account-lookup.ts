import type { PrismaClient, User } from "generated/prisma/client";

type AccountLookupPrisma = Pick<PrismaClient, "user">;

export class PrismaAccountLookup {
	constructor(private readonly db: AccountLookupPrisma) {}

	findById(userId: string): Promise<User | null> {
		return this.db.user.findFirst({
			where: { id: userId },
		});
	}
}
