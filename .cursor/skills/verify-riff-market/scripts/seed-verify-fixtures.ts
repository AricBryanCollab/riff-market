import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";
import { listingPhotos } from "@/assets/listing-photos";
import { MARKETPLACE_CURRENCY_CODE } from "@/domains/shared/domain/currency";
import { toHashPassword } from "@/utils/bcrypt";

const PASSWORD = "riffmarket-seed";

const accounts = [
	{
		id: "verify-customer",
		email: "customer@verify.riffmarket.dev",
		firstName: "Casey",
		lastName: "Customer",
		role: "CUSTOMER",
	},
	{
		id: "verify-admin",
		email: "admin@verify.riffmarket.dev",
		firstName: "Avery",
		lastName: "Admin",
		role: "ADMIN",
	},
] as const;

const pendingListings = [
	{
		id: "verify-pending-jazzmaster",
		name: "Verify Pending Jazzmaster",
		brand: "Fender",
		model: "Jazzmaster",
		category: "ELECTRIC",
		condition: "USED",
		priceAmountMinor: 45000,
		stock: 1,
		description: "Offset body awaiting admin review.",
		photo: listingPhotos.telecaster,
	},
	{
		id: "verify-pending-wah",
		name: "Verify Pending Wah Pedal",
		brand: "Dunlop",
		model: "Cry Baby",
		category: "PEDALS",
		condition: "NEW",
		priceAmountMinor: 2900,
		stock: 2,
		description: "Classic wah awaiting admin review.",
		photo: listingPhotos.bossDs1,
	},
] as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString }),
});

try {
	const password = await toHashPassword(PASSWORD);
	for (const account of accounts) {
		await prisma.user.upsert({
			where: { id: account.id },
			update: {},
			create: { ...account, password },
		});
	}
	for (const { photo, ...listing } of pendingListings) {
		await prisma.listing.upsert({
			where: { id: listing.id },
			update: {},
			create: {
				...listing,
				sellerId: "seed-seller-vintage-boxes",
				images: [{ url: photo, publicId: listing.id }],
				currencyCode: MARKETPLACE_CURRENCY_CODE,
				isApproved: false,
				listingStatus: "PENDING",
			},
		});
	}
	console.log(
		`Seeded ${accounts.length} verify accounts and ${pendingListings.length} pending listings`,
	);
} finally {
	await prisma.$disconnect();
}
