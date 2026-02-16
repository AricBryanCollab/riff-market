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

import { createProductService, updateProductService } from "./product";

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
});
