import { test as teardown } from "@playwright/test";
import {
	cleanDatabase,
	createTestPrismaClient,
} from "../../src/test/prisma-test-data";

teardown("clean e2e test database", async () => {
	const db = createTestPrismaClient();

	try {
		await cleanDatabase(db);
	} finally {
		await db.$disconnect();
	}
});
