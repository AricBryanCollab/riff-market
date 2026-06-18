import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

const { productRepoMock } = vi.hoisted(() => {
	const productRepoMock = {
		getApprovedProducts: vi.fn(),
		getProductById: vi.fn(),
		getProductCountByCategory: vi.fn(),
		getProductCountByStatus: vi.fn(),
		getProductsByIds: vi.fn(),
		getProductsBySellerId: vi.fn(),
		getRecentProducts: vi.fn(),
	} as const;

	return { productRepoMock };
});

vi.mock("@/data/product-repo", () => productRepoMock);

import {
	getApprovedProductsService,
	getProductByIdService,
	getProductCountByCategoryService,
	getProductCountByStatusService,
	getProductsByIdsService,
	getProductsBySellerService,
	getRecentProductsService,
} from "./product";

function makeImageAssetRef(url: string) {
	return {
		url,
		publicId:
			url
				.split("/")
				.pop()
				?.replace(/\.[^/.]+$/, "") ?? "",
	};
}

function makeProduct(overrides: Record<string, unknown> = {}) {
	return {
		id: "prod-1",
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "NEW",
		brand: "Fender",
		model: "American Standard",
		description: "A test guitar",
		images: [makeImageAssetRef("https://cdn.example.com/telecaster.jpg")],
		price: 400,
		priceCents: 40000,
		currencyCode: "USD",
		stock: 2,
		isApproved: true,
		listingStatus: "APPROVED",
		createdAt: new Date("2026-06-18T00:00:00.000Z"),
		updatedAt: new Date("2026-06-18T00:00:00.000Z"),
		seller: {
			firstName: "A",
			lastName: "Seller",
			email: "seller@example.com",
		},
		...overrides,
	};
}

describe("product read actions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns product not found when reading by id and product missing", async () => {
		(productRepoMock.getProductById as Mock).mockResolvedValue(null);

		const result = await getProductByIdService("missing");

		expect(result).toMatchObject({
			error: "Product not found",
		});
	});

	it("enforces customer-only access when fetching products by ids", async () => {
		const result = await getProductsByIdsService("SELLER", {
			ids: ["prod-1", "prod-2"],
		});

		expect(result).toMatchObject({
			error: "Unauthorized, user must be a customer",
		});
		expect(productRepoMock.getProductsByIds).not.toHaveBeenCalled();
	});

	it("validates product id batch queries", async () => {
		const result = await getProductsByIdsService("CUSTOMER", { ids: [] });

		expect(result).toMatchObject({
			error: "Invalid product IDs query",
			details: expect.any(Object),
		});
		expect(productRepoMock.getProductsByIds).not.toHaveBeenCalled();
	});

	it("dedupes product id batch queries and returns image URLs", async () => {
		const product = makeProduct();
		(productRepoMock.getProductsByIds as Mock).mockResolvedValue([product]);

		const result = await getProductsByIdsService("CUSTOMER", {
			ids: ["prod-1", "prod-1", "prod-2"],
		});

		expect(result).toEqual([
			{
				...product,
				images: ["https://cdn.example.com/telecaster.jpg"],
			},
		]);
		expect(productRepoMock.getProductsByIds).toHaveBeenCalledWith([
			"prod-1",
			"prod-2",
		]);
	});

	it("enforces seller access when querying products by seller", async () => {
		const result = await getProductsBySellerService("", "CUSTOMER");

		expect(result).toMatchObject({
			error: "Unauthorized, user must be a seller",
		});
		expect(productRepoMock.getProductsBySellerId).not.toHaveBeenCalled();
	});

	it("returns seller products with image URLs", async () => {
		const product = makeProduct();
		(productRepoMock.getProductsBySellerId as Mock).mockResolvedValue([
			product,
		]);

		const result = await getProductsBySellerService("seller-1", "SELLER");

		expect(result).toEqual([
			{
				...product,
				images: ["https://cdn.example.com/telecaster.jpg"],
			},
		]);
		expect(productRepoMock.getProductsBySellerId).toHaveBeenCalledWith(
			"seller-1",
		);
	});

	it("validates approved product query params", async () => {
		const result = await getApprovedProductsService({ limit: "0" });

		expect(result).toMatchObject({
			error: "Invalid product queries",
			details: expect.any(Object),
		});
		expect(productRepoMock.getApprovedProducts).not.toHaveBeenCalled();
	});

	it("parses approved product query params and returns image URLs", async () => {
		const product = makeProduct();
		(productRepoMock.getApprovedProducts as Mock).mockResolvedValue([product]);

		const result = await getApprovedProductsService({
			limit: "5",
			offset: "10",
			random: "true",
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			search: "tele",
			priceMin: "199.95",
			priceMax: "500",
		});

		expect(result).toEqual([
			{
				...product,
				images: ["https://cdn.example.com/telecaster.jpg"],
			},
		]);
		expect(productRepoMock.getApprovedProducts).toHaveBeenCalledWith({
			limit: 5,
			offset: 10,
			random: true,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			search: "tele",
			priceMinCents: 19995,
			priceMaxCents: 50000,
		});
	});

	it("returns product counts", async () => {
		(productRepoMock.getProductCountByCategory as Mock).mockResolvedValue([
			{ category: "ELECTRIC", count: 2 },
		]);
		(productRepoMock.getProductCountByStatus as Mock).mockResolvedValueOnce(3);
		(productRepoMock.getProductCountByStatus as Mock).mockResolvedValueOnce(4);

		await expect(getProductCountByCategoryService()).resolves.toEqual([
			{ category: "ELECTRIC", count: 2 },
		]);
		await expect(getProductCountByStatusService(true)).resolves.toEqual({
			approvedProductCount: 3,
		});
		await expect(getProductCountByStatusService(false)).resolves.toEqual({
			pendingProductCount: 4,
		});
	});

	it("returns recent products with image URLs", async () => {
		const product = makeProduct();
		(productRepoMock.getRecentProducts as Mock).mockResolvedValue([product]);

		const result = await getRecentProductsService();

		expect(result).toEqual([
			{
				...product,
				images: ["https://cdn.example.com/telecaster.jpg"],
			},
		]);
		expect(productRepoMock.getRecentProducts).toHaveBeenCalledWith(8);
	});
});
