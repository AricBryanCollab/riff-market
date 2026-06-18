import type { ProductCategory, ProductCondtion } from "generated/prisma/enums";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/product", () => ({
	getProductByIdService: vi.fn(),
}));

import { getProductByIdResponse } from "./product-read-service";

describe("product read API responses", () => {
	it("returns not found as an HTTP error so product detail clients enter their error state", async () => {
		const response = await getProductByIdResponse("missing", async () => ({
			error: "Product not found",
		}));

		await expect(response.json()).resolves.toEqual({
			message: "Product not found",
		});
		expect(response.status).toBe(404);
		expect(response.ok).toBe(false);
	});

	it("returns product details as a successful response", async () => {
		const product = {
			id: "prod-1",
			sellerId: "seller-1",
			name: "Telecaster",
			category: "ELECTRIC" as ProductCategory,
			condition: "NEW" as ProductCondtion,
			brand: "Fender",
			model: "American Standard",
			description: "A test guitar",
			images: ["https://cdn.example.com/telecaster.jpg"],
			price: 400,
			priceCents: 40000,
			currencyCode: "USD",
			stock: 2,
			isApproved: true,
			listingStatus: "APPROVED" as const,
			createdAt: new Date("2026-06-18T00:00:00.000Z"),
			updatedAt: new Date("2026-06-18T00:00:00.000Z"),
			seller: {
				firstName: "A",
				lastName: "Seller",
				email: "seller@example.com",
			},
		};

		const response = await getProductByIdResponse(
			"prod-1",
			async () => product,
		);

		await expect(response.json()).resolves.toEqual({
			...product,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		});
		expect(response.status).toBe(200);
		expect(response.ok).toBe(true);
	});
});
