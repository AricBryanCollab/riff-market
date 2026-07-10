import { test as setup } from "@playwright/test";
import {
	cleanDatabase,
	createTestPrismaClient,
	seedListing,
	seedMarketplaceUsers,
} from "../../src/test/prisma-test-data";

setup("seed listing detail smoke data", async () => {
	const db = createTestPrismaClient();

	try {
		await cleanDatabase(db);
		await seedMarketplaceUsers(db);
		await seedListing(db, {
			id: "smoke-approved-listing",
			name: "Smoke Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
		});
	} finally {
		await db.$disconnect();
	}
});
