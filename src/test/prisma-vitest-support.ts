import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import { cleanDatabase, createTestPrismaClient } from "./prisma-test-data";

export {
	cleanDatabase,
	createTestPrismaClient,
	productStock,
	seedListing,
	seedMarketplaceUsers,
	seedProduct,
	seedPurchaseWithSellerOrders,
} from "./prisma-test-data";

const runDbTests = process.env.RUN_DB_TESTS === "1";

export const describeDb = runDbTests ? describe : describe.skip;

export function setupPrismaTestDatabase() {
	let client: ReturnType<typeof createTestPrismaClient> | undefined;

	beforeAll(() => {
		client = createTestPrismaClient();
	});

	beforeEach(async () => {
		await cleanDatabase(getClient());
	});

	afterAll(async () => {
		if (!client) {
			return;
		}

		try {
			await cleanDatabase(client);
		} finally {
			await client.$disconnect();
		}
	});

	return {
		get client() {
			return getClient();
		},
	};

	function getClient() {
		if (!client) {
			throw new Error("Prisma test database was accessed before setup");
		}

		return client;
	}
}
