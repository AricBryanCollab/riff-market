import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import type {
	CreateProductInput,
	UpdateProductInput,
} from "@/lib/zod/product-validation";

const productRepoMock = {
	createProduct: vi.fn(),
	deleteProductById: vi.fn(),
	getApprovedProducts: vi.fn(),
	getPendingApprovalProducts: vi.fn(),
	getProductById: vi.fn(),
	getProductCountByCategory: vi.fn(),
	getProductCountByStatus: vi.fn(),
	getProductsByIds: vi.fn(),
	getProductsBySellerId: vi.fn(),
	getRecentProducts: vi.fn(),
	updateProductById: vi.fn(),
	updateProductStatus: vi.fn(),
} as const;

const cloudinaryMock = {
	deleteImage: vi.fn(),
	getPublicId: vi.fn((url: string) => {
		const filename = url.split("/").pop();
		return filename ? filename.split(".")[0] : "";
	}),
	unsignedUploadImage: vi.fn(),
} as const;

const compressImageMock = vi.fn();

vi.mock("@/env", () => ({
	env: {
		CLOUDINARY_UPLOAD_PRESET: "test-preset",
	},
}));

vi.mock("@/data/product-repo", () => productRepoMock);
vi.mock("@/utils/cloudinary", () => cloudinaryMock);
vi.mock("@/utils/compress-image", () => ({
	compressImage: compressImageMock,
}));

import {
	createProductService,
	deleteProductService,
	getApprovedProductsService,
	getProductByIdService,
	getProductsByIdsService,
	getProductsBySellerService,
	updateProductService,
	updateProductStatusService,
} from "./product";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeImage(name: string) {
	return new File([`bytes-${name}`], name, {
		type: "image/jpeg",
	});
}

function createValidPayload(images: File[]): CreateProductInput {
	return {
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "NEW",
		brand: "Fender",
		model: "American Standard",
		description: "A test guitar",
		price: 199,
		stock: 2,
		images,
	};
}

function withCompressedImage(): Promise<{
	buffer: Buffer;
	originalSize: number;
	compressedSize: number;
	mime: string;
}> {
	return Promise.resolve({
		buffer: Buffer.from("compressed"),
		originalSize: 10,
		compressedSize: 8,
		mime: "image/jpeg",
	});
}

function makeExistingProduct() {
	return {
		id: "prod-1",
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "NEW",
		brand: "Fender",
		model: "Player",
		description: "Great guitar",
		images: ["https://cdn.example.com/old.jpg"],
		price: 200,
		stock: 5,
		isApproved: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		seller: {
			firstName: "A",
			lastName: "Seller",
			email: "seller@example.com",
		},
	};
}

describe("product actions", () => {
	afterEach(() => {
		vi.clearAllMocks();
		(cloudinaryMock.deleteImage as Mock).mockResolvedValue(undefined);
	});

	it("uploads new-product images using bounded parallelism", async () => {
		const files = [
			makeImage("img-1.jpg"),
			makeImage("img-2.jpg"),
			makeImage("img-3.jpg"),
			makeImage("img-4.jpg"),
			makeImage("img-5.jpg"),
		];

		(compressImageMock as Mock).mockImplementation(withCompressedImage);

		let activeUploads = 0;
		let maxActiveUploads = 0;

		(cloudinaryMock.unsignedUploadImage as Mock).mockImplementation(
			async () => {
				activeUploads += 1;
				maxActiveUploads = Math.max(maxActiveUploads, activeUploads);
				await sleep(15);
				activeUploads -= 1;

				return {
					secure_url: `https://cdn.example.com/${Date.now()}.jpg`,
				};
			},
		);

		(productRepoMock.createProduct as Mock).mockResolvedValue({
			id: "new-product",
			images: [],
		});

		const payload = createValidPayload(files);
		const result = await createProductService("seller-1", "SELLER", payload);

		expect(result).toEqual({
			id: "new-product",
			images: [],
		});
		expect(cloudinaryMock.unsignedUploadImage).toHaveBeenCalledTimes(
			files.length,
		);
		expect(maxActiveUploads).toBeLessThanOrEqual(3);
		expect(maxActiveUploads).toBeGreaterThan(1);
	});

	it("cleans up already uploaded images when create upload fails", async () => {
		const files = [
			makeImage("img-1.jpg"),
			makeImage("img-2.jpg"),
			makeImage("img-3.jpg"),
		];

		(compressImageMock as Mock).mockImplementation(withCompressedImage);

		(cloudinaryMock.unsignedUploadImage as Mock).mockImplementation(
			async ({ filename }) => {
				if (filename === "img-2.jpg") {
					await sleep(20);
					throw new Error("upload failed");
				}

				if (filename === "img-3.jpg") {
					await sleep(30);
				}

				await sleep(1);
				return { secure_url: `https://cdn.example.com/${filename}` };
			},
		);

		const payload = createValidPayload(files);
		const result = await createProductService("seller-1", "SELLER", payload);

		expect(result).toMatchObject({
			error: "Failed to upload images",
			details: "upload failed",
		});
		expect(productRepoMock.createProduct).not.toHaveBeenCalled();
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("img-1");
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledTimes(1);
	});

	it("returns upload error if cleanup fails on create", async () => {
		const files = [makeImage("img-1.jpg"), makeImage("img-2.jpg")];

		(compressImageMock as Mock).mockImplementation(withCompressedImage);

		(cloudinaryMock.unsignedUploadImage as Mock).mockImplementation(
			async ({ filename }) => {
				if (filename === "img-2.jpg") {
					await sleep(8);
					throw new Error("upload failed");
				}

				await sleep(1);
				return { secure_url: `https://cdn.example.com/${filename}` };
			},
		);

		(cloudinaryMock.deleteImage as Mock).mockRejectedValue(
			new Error("delete failed"),
		);

		const payload = createValidPayload(files);
		const result = await createProductService("seller-1", "SELLER", payload);

		expect(result).toMatchObject({
			error: "Failed to upload images",
			details: "upload failed",
		});
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledTimes(1);
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("img-1");
	});

	it("rejects create when role is not authorized", async () => {
		const payload = createValidPayload([makeImage("img-1.jpg")]);

		const result = await createProductService("seller-1", "CUSTOMER", payload);

		expect(result).toMatchObject({
			error: "Unauthorized, user must be a seller",
		});
		expect(productRepoMock.createProduct).not.toHaveBeenCalled();
		expect(cloudinaryMock.unsignedUploadImage).not.toHaveBeenCalled();
	});

	it("rejects invalid create payload before uploading", async () => {
		const payload = createValidPayload([]);

		const result = await createProductService("seller-1", "SELLER", payload);

		expect(result).toMatchObject({
			error: "Invalid data to create product",
		});
		expect(productRepoMock.createProduct).not.toHaveBeenCalled();
		expect(compressImageMock as Mock).not.toHaveBeenCalled();
		expect(cloudinaryMock.unsignedUploadImage as Mock).not.toHaveBeenCalled();
	});

	it("updates images for existing products through same upload pipeline", async () => {
		const existingProduct = {
			id: "prod-1",
			sellerId: "seller-1",
			name: "Telecaster",
			category: "ELECTRIC",
			condition: "NEW",
			brand: "Fender",
			model: "Player",
			description: "Great guitar",
			images: ["https://cdn.example.com/old.jpg"],
			price: 200,
			stock: 5,
			isApproved: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			seller: {
				firstName: "A",
				lastName: "Seller",
				email: "seller@example.com",
			},
		};

		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);
		(productRepoMock.updateProductById as Mock).mockResolvedValue({
			id: "prod-1",
			sellerId: "seller-1",
			name: "Telecaster",
			category: "ELECTRIC",
			condition: "NEW",
			brand: "Fender",
			model: "Player",
			description: "Great guitar",
			images: ["https://cdn.example.com/new.jpg"],
			price: 200,
			stock: 5,
			isApproved: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			seller: existingProduct.seller,
		});
		(compressImageMock as Mock).mockImplementation(withCompressedImage);
		(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
			secure_url: "https://cdn.example.com/new.jpg",
		});

		const result = await updateProductService("prod-1", "seller-1", "SELLER", {
			images: [makeImage("img-new.jpg")],
		} as UpdateProductInput);

		expect(result).toMatchObject({ id: "prod-1" });
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old");
		expect(productRepoMock.updateProductById).toHaveBeenCalledWith(
			"prod-1",
			expect.objectContaining({
				images: ["https://cdn.example.com/new.jpg"],
				isApproved: false,
			}),
		);
	});

	it("does not process uploads when update target does not exist", async () => {
		(productRepoMock.getProductById as Mock).mockResolvedValue(null);

		const result = await updateProductService("missing", "seller-1", "SELLER", {
			name: "New name",
		} as UpdateProductInput);

		expect(result).toMatchObject({ error: "Product not found" });
		expect(productRepoMock.updateProductById).not.toHaveBeenCalled();
		expect(compressImageMock as Mock).not.toHaveBeenCalled();
		expect(cloudinaryMock.unsignedUploadImage as Mock).not.toHaveBeenCalled();
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

	it("validates query schema for products-by-ids", async () => {
		const result = await getProductsByIdsService("CUSTOMER", { ids: [] });

		expect(result).toMatchObject({
			error: "Invalid product IDs query",
			details: expect.any(Object),
		});
		expect(productRepoMock.getProductsByIds).not.toHaveBeenCalled();
	});

	it("propagates repository failures for products-by-ids", async () => {
		(productRepoMock.getProductsByIds as Mock).mockRejectedValue(
			new Error("failed to fetch products by ids"),
		);

		await expect(
			getProductsByIdsService("CUSTOMER", { ids: ["prod-1"] }),
		).rejects.toThrow("failed to fetch products by ids");
	});

	it("returns products for customer id lookup with deduped ids", async () => {
		const products = [
			{
				id: "prod-1",
				name: "Telecaster",
				sellerId: "seller-1",
				category: "ELECTRIC",
				condition: "NEW",
				brand: "Fender",
				model: "American Standard",
				description: "A test guitar",
				images: ["https://cdn.example.com/telecaster.jpg"],
				price: 400,
				stock: 2,
				isApproved: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				seller: {
					firstName: "A",
					lastName: "Seller",
					email: "seller@example.com",
				},
			},
		];

		(productRepoMock.getProductsByIds as Mock).mockResolvedValue(products);

		const result = await getProductsByIdsService("CUSTOMER", {
			ids: ["prod-1", "prod-1", "prod-2"],
		});

		expect(result).toEqual(products);
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

	it("returns products for seller on valid seller query", async () => {
		const products = [
			{
				id: "prod-1",
				name: "Telecaster",
				sellerId: "seller-1",
				category: "ELECTRIC",
				condition: "NEW",
				brand: "Fender",
				model: "American Standard",
				description: "A test guitar",
				images: ["https://cdn.example.com/telecaster.jpg"],
				price: 500,
				stock: 3,
				isApproved: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				seller: {
					firstName: "A",
					lastName: "Seller",
					email: "seller@example.com",
				},
			},
		];

		(productRepoMock.getProductsBySellerId as Mock).mockResolvedValue(products);

		const result = await getProductsBySellerService("seller-1", "SELLER");

		expect(result).toEqual(products);
		expect(productRepoMock.getProductsBySellerId).toHaveBeenCalledWith(
			"seller-1",
		);
	});

	it("requires seller id for seller products lookup", async () => {
		const result = await getProductsBySellerService("", "SELLER");

		expect(result).toMatchObject({
			error: "Unauthorized, user must be a seller",
		});
		expect(productRepoMock.getProductsBySellerId).not.toHaveBeenCalled();
	});

	it("propagates repository failures for seller products lookup", async () => {
		(productRepoMock.getProductsBySellerId as Mock).mockRejectedValue(
			new Error("failed to fetch seller products"),
		);

		await expect(
			getProductsBySellerService("seller-1", "SELLER"),
		).rejects.toThrow("failed to fetch seller products");
	});

	it("validates approved products query schema", async () => {
		const result = await getApprovedProductsService({
			limit: "0",
			offset: "0",
		});

		expect(result).toMatchObject({
			error: "Invalid product queries",
			details: expect.any(Object),
		});
		expect(productRepoMock.getApprovedProducts).not.toHaveBeenCalled();
	});

	it("returns approved products for valid query", async () => {
		const products = [
			{
				id: "prod-2",
				name: "P-90",
				sellerId: "seller-2",
				category: "ACCESSORY",
				condition: "NEW",
				brand: "Gibson",
				model: "Les Paul",
				description: "Pickup cover",
				images: ["https://cdn.example.com/pickup.jpg"],
				price: 75,
				stock: 12,
				isApproved: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				seller: {
					firstName: "B",
					lastName: "Maker",
					email: "maker@example.com",
				},
			},
		];

		(productRepoMock.getApprovedProducts as Mock).mockResolvedValue(products);

		const result = await getApprovedProductsService({
			limit: "5",
			offset: "2",
			random: "false",
			category: "ACCESSORY",
			condition: "NEW",
			brand: "Gibson",
			search: "pickup",
			priceMin: "50",
			priceMax: "150",
		});

		expect(result).toEqual(products);
		expect(productRepoMock.getApprovedProducts).toHaveBeenCalledWith({
			limit: 5,
			offset: 2,
			random: false,
			category: "ACCESSORY",
			condition: "NEW",
			brand: "Gibson",
			search: "pickup",
			priceMin: 50,
			priceMax: 150,
		});
	});

	it("requires authenticated seller for update", async () => {
		const result = await updateProductService("prod-1", "", "SELLER", {
			name: "New name",
		} as UpdateProductInput);

		expect(result).toMatchObject({
			error: "User is unauthorized",
		});
		expect(productRepoMock.getProductById).not.toHaveBeenCalled();
		expect(productRepoMock.updateProductById).not.toHaveBeenCalled();
	});

	it("validates update payload before saving", async () => {
		const existingProduct = makeExistingProduct();
		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);

		const result = await updateProductService("prod-1", "seller-1", "SELLER", {
			price: -1,
		} as UpdateProductInput);

		expect(result).toMatchObject({
			error: "Invalid data to update product",
		});
		expect(productRepoMock.updateProductById).not.toHaveBeenCalled();
		expect(cloudinaryMock.unsignedUploadImage).not.toHaveBeenCalled();
	});

	it("updates product status on valid approval payload", async () => {
		const existingProduct = makeExistingProduct();
		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);

		const approvedProduct = {
			id: "prod-1",
			name: "Telecaster",
			isApproved: true,
		};

		(productRepoMock.updateProductStatus as Mock).mockResolvedValue(
			approvedProduct,
		);

		const result = await updateProductStatusService("prod-1", {
			isApproved: true,
		});

		expect(result).toMatchObject(approvedProduct);
		expect(productRepoMock.updateProductStatus).toHaveBeenCalledWith(
			"prod-1",
			existingProduct.sellerId,
			existingProduct.name,
			true,
		);
	});

	it("deletes product on valid rejection payload", async () => {
		const existingProduct = makeExistingProduct();
		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);

		const declinedProduct = {
			id: "prod-1",
			name: "Telecaster",
			isApproved: false,
		};

		(productRepoMock.updateProductStatus as Mock).mockResolvedValue(
			declinedProduct,
		);

		const result = await updateProductStatusService("prod-1", {
			isApproved: false,
		});

		expect(result).toMatchObject(declinedProduct);
		expect(productRepoMock.updateProductStatus).toHaveBeenCalledWith(
			"prod-1",
			existingProduct.sellerId,
			existingProduct.name,
			false,
		);
	});

	it("propagates repository failures on status update", async () => {
		const existingProduct = makeExistingProduct();
		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);

		(productRepoMock.updateProductStatus as Mock).mockRejectedValue(
			new Error("repo failure"),
		);

		await expect(
			updateProductStatusService("prod-1", {
				isApproved: true,
			}),
		).rejects.toThrow("repo failure");
	});

	it("validates product status payload schema", async () => {
		const existingProduct = makeExistingProduct();
		(productRepoMock.getProductById as Mock).mockResolvedValue(existingProduct);

		const result = await updateProductStatusService("prod-1", {
			isApproved: "yes" as unknown as boolean,
		});

		expect(result).toMatchObject({
			error: "Invalid data for update product status",
			details: expect.any(Object),
		});
		expect(productRepoMock.updateProductStatus).not.toHaveBeenCalled();
	});

	it("returns unauthorized for delete when user is missing", async () => {
		const result = await deleteProductService("prod-1", "");

		expect(result).toMatchObject({
			error: "User is unauthorized",
		});
		expect(productRepoMock.getProductById).not.toHaveBeenCalled();
		expect(productRepoMock.deleteProductById).not.toHaveBeenCalled();
	});

	it("returns product missing when deleting or updating status", async () => {
		(productRepoMock.getProductById as Mock).mockResolvedValue(null);

		const updateStatusResult = await updateProductStatusService("prod-1", {
			isApproved: true,
		});
		const deleteResult = await deleteProductService("prod-1", "seller-1");

		expect(updateStatusResult).toMatchObject({
			error: "Product not found",
		});
		expect(deleteResult).toMatchObject({
			error: "Product not found",
		});
		expect(productRepoMock.updateProductStatus).not.toHaveBeenCalled();
		expect(productRepoMock.deleteProductById).not.toHaveBeenCalled();
	});
});
