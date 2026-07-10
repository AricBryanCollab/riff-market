import {
	MediaCleanupJobSourceType,
	type PrismaClient,
} from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import { PrismaAccountProfiles } from "@/domains/accounts/infrastructure/prisma-account-profiles";
import {
	deleteCurrentUser,
	getCurrentUser,
	updateCurrentUser,
} from "@/server/account-service";
import {
	describeDb,
	seedListing,
	seedMarketplaceUsers,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";

describeDb("account service Prisma integration", () => {
	let db: PrismaClient;
	let accounts: PrismaAccountProfiles;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		await seedMarketplaceUsers(db);
		accounts = new PrismaAccountProfiles(db);
	});

	it("reads and updates persisted account profile data", async () => {
		await expect(getCurrentUser("customer-1", accounts)).resolves.toEqual({
			id: "customer-1",
			firstName: "Pat",
			lastName: "Buyer",
			email: "customer@example.com",
			role: "CUSTOMER",
			theme: "light",
			phone: null,
			profilePic: null,
			address: null,
		});

		await expect(
			updateCurrentUser(
				"customer-1",
				{
					firstName: "Patricia",
					phone: "5550100000",
					theme: "dark",
				},
				accounts,
			),
		).resolves.toMatchObject({
			id: "customer-1",
			firstName: "Patricia",
			phone: "5550100000",
			theme: "dark",
		});

		await expect(getCurrentUser("customer-1", accounts)).resolves.toMatchObject(
			{
				firstName: "Patricia",
				phone: "5550100000",
				theme: "dark",
			},
		);
	});

	it("deletes matching accounts and stages media cleanup jobs", async () => {
		await db.userSettings.create({
			data: {
				userId: "seller-1",
				theme: "dark",
				profilePic: {
					url: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
					publicId: "avatars/seller-1",
				},
			},
		});
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			images: [
				{
					url: "https://res.cloudinary.com/riff/image/upload/listings/one.jpg",
					publicId: "listings/one",
				},
			],
		});

		await expect(
			deleteCurrentUser("seller-1", "seller-1@example.com", accounts),
		).resolves.toEqual({
			message: "Account has been deleted successfully",
			deletedUserId: "seller-1",
		});

		await expect(getCurrentUser("seller-1", accounts)).rejects.toMatchObject({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			message: "User not found",
			status: 404,
		});
		await expect(
			db.mediaCleanupJob.findMany({
				where: { sourceUserId: "seller-1" },
				select: {
					provider: true,
					assetType: true,
					providerAssetId: true,
					sourceType: true,
				},
				orderBy: { providerAssetId: "asc" },
			}),
		).resolves.toEqual([
			{
				provider: "cloudinary",
				assetType: "image",
				providerAssetId: "avatars/seller-1",
				sourceType: MediaCleanupJobSourceType.USER_PROFILE,
			},
			{
				provider: "cloudinary",
				assetType: "image",
				providerAssetId: "listings/one",
				sourceType: MediaCleanupJobSourceType.LISTING,
			},
		]);
	});
});
