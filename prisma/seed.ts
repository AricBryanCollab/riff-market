import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
	type ListingCategory,
	type ListingCondition,
	PrismaClient,
} from "generated/prisma/client";
import { listingPhotos } from "@/assets/listing-photos";
import { MARKETPLACE_CURRENCY_CODE } from "@/domains/shared/domain/currency";
import { toHashPassword } from "@/utils/bcrypt";

const SEED_PASSWORD = "riffmarket-seed";

interface SeedListing {
	readonly key: keyof typeof listingPhotos;
	readonly name: string;
	readonly brand: string;
	readonly model: string;
	readonly category: ListingCategory;
	readonly condition: ListingCondition;
	readonly priceAmountMinor: number;
	readonly stock: number;
	readonly description: string;
}

const sellers = [
	{
		id: "seed-seller-vintage-boxes",
		email: "vintage.boxes@seed.riffmarket.dev",
		firstName: "Vintage",
		lastName: "Boxes",
	},
	{
		id: "seed-seller-tone-hunter",
		email: "tone.hunter@seed.riffmarket.dev",
		firstName: "Tone",
		lastName: "Hunter",
	},
	{
		id: "seed-seller-keys-king",
		email: "keys.king@seed.riffmarket.dev",
		firstName: "Keys",
		lastName: "King",
	},
] as const;

const listings: readonly SeedListing[] = [
	{
		key: "stratocaster",
		name: "Fender American Professional II Stratocaster",
		brand: "Fender",
		model: "American Professional II",
		category: "ELECTRIC",
		condition: "MINT",
		priceAmountMinor: 52000,
		stock: 1,
		description: "Three-tone sunburst Strat with V-Mod II pickups and case.",
	},
	{
		key: "lesPaul",
		name: "Gibson Les Paul Standard '60s",
		brand: "Gibson",
		model: "Les Paul Standard",
		category: "ELECTRIC",
		condition: "USED",
		priceAmountMinor: 78000,
		stock: 1,
		description: "Flame maple top, slim taper neck, 60s Burstbucker pickups.",
	},
	{
		key: "martinD28",
		name: "Martin D-28 Standard Dreadnought",
		brand: "Martin",
		model: "D-28",
		category: "ACOUSTIC",
		condition: "USED",
		priceAmountMinor: 95000,
		stock: 1,
		description: "Spruce and rosewood dreadnought with a big, balanced voice.",
	},
	{
		key: "nordStage",
		name: "Nord Stage 4 88",
		brand: "Nord",
		model: "Stage 4",
		category: "KEYBOARD",
		condition: "NEW",
		priceAmountMinor: 138000,
		stock: 2,
		description:
			"Fully weighted triple-sensor keybed with piano, organ and synth.",
	},
	{
		key: "bossDs1",
		name: "Boss DS-1 Distortion",
		brand: "Boss",
		model: "DS-1",
		category: "PEDALS",
		condition: "USED",
		priceAmountMinor: 1800,
		stock: 3,
		description: "The classic orange distortion stompbox.",
	},
	{
		key: "taylorAcoustic",
		name: "Taylor 814ce Builder's Edition",
		brand: "Taylor",
		model: "814ce",
		category: "ACOUSTIC",
		condition: "MINT",
		priceAmountMinor: 128000,
		stock: 1,
		description: "Grand Auditorium cutaway with ES2 electronics.",
	},
	{
		key: "telecaster",
		name: "Fender Custom Shop Telecaster",
		brand: "Fender",
		model: "Telecaster",
		category: "ELECTRIC",
		condition: "MINT",
		priceAmountMinor: 118000,
		stock: 1,
		description: "Black Custom Shop Tele with a punchy bridge pickup.",
	},
	{
		key: "korgMinilogue",
		name: "Korg Minilogue XD",
		brand: "Korg",
		model: "Minilogue XD",
		category: "KEYBOARD",
		condition: "MINT",
		priceAmountMinor: 21000,
		stock: 2,
		description: "Four-voice analog polysynth with digital multi-engine.",
	},
	{
		key: "tubeScreamer",
		name: "Ibanez TS9 Tube Screamer",
		brand: "Ibanez",
		model: "TS9",
		category: "PEDALS",
		condition: "NEW",
		priceAmountMinor: 3200,
		stock: 4,
		description: "Mid-hump overdrive for pushing a tube amp.",
	},
	{
		key: "ibanezRg",
		name: "Ibanez RG350EXZ",
		brand: "Ibanez",
		model: "RG350EXZ",
		category: "ELECTRIC",
		condition: "USED",
		priceAmountMinor: 16500,
		stock: 1,
		description: "Fast Wizard III neck with an Edge-Zero II tremolo.",
	},
	{
		key: "yamahaClassical",
		name: "Yamaha C40 Classical Guitar",
		brand: "Yamaha",
		model: "C40",
		category: "ACOUSTIC",
		condition: "USED",
		priceAmountMinor: 3500,
		stock: 2,
		description: "Nylon-string classical, a dependable first guitar.",
	},
	{
		key: "prophetSynth",
		name: "Sequential Prophet '08",
		brand: "Sequential",
		model: "Prophet '08",
		category: "KEYBOARD",
		condition: "USED",
		priceAmountMinor: 62000,
		stock: 1,
		description: "Eight-voice analog poly with Curtis filters.",
	},
	{
		key: "bigMuff",
		name: "Electro-Harmonix Big Muff Pi",
		brand: "Electro-Harmonix",
		model: "Big Muff Pi",
		category: "PEDALS",
		condition: "USED",
		priceAmountMinor: 2600,
		stock: 2,
		description: "Thick, sustaining fuzz.",
	},
	{
		key: "shureSm58",
		name: "Shure SM58 Dynamic Microphone",
		brand: "Shure",
		model: "SM58",
		category: "ACCESSORY",
		condition: "NEW",
		priceAmountMinor: 3300,
		stock: 5,
		description: "Cardioid dynamic vocal mic.",
	},
];

async function main() {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Refusing to seed demo data with NODE_ENV=production");
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is required to seed the database");
	}

	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString }),
	});

	try {
		const password = await toHashPassword(SEED_PASSWORD);

		for (const seller of sellers) {
			await prisma.user.upsert({
				where: { id: seller.id },
				update: {},
				create: { ...seller, password, role: "SELLER" },
			});
		}

		const newestCreatedAt = Date.now();

		for (const [index, listing] of listings.entries()) {
			const { key, ...fields } = listing;
			const id = `seed-listing-${key}`;
			const data = {
				...fields,
				sellerId: sellers[index % sellers.length].id,
				images: [{ url: listingPhotos[key], publicId: id }],
				currencyCode: MARKETPLACE_CURRENCY_CODE,
				isApproved: true,
				listingStatus: "APPROVED" as const,
				createdAt: new Date(newestCreatedAt - index * 60_000),
			};

			await prisma.listing.upsert({
				where: { id },
				update: data,
				create: { id, ...data },
			});
		}

		console.log(
			`Seeded ${sellers.length} sellers and ${listings.length} approved listings`,
		);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
