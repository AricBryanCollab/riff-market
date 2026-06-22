import { describe, expect, it } from "vitest";
import {
	getProductsByIdsService,
	type ProductReadDependencies,
} from "./product";

describe("product read actions", () => {
	it("enforces customer-only access when fetching products by ids", async () => {
		const result = await getProductsByIdsService(
			"SELLER",
			{
				ids: ["prod-1", "prod-2"],
			},
			failingProductReadDependencies(),
		);

		expect(result).toMatchObject({
			error: "Unauthorized, user must be a customer",
		});
	});

	it("validates product id batch queries", async () => {
		const result = await getProductsByIdsService(
			"CUSTOMER",
			{ ids: [] },
			failingProductReadDependencies(),
		);

		expect(result).toMatchObject({
			error: "Invalid product IDs query",
			details: expect.any(Object),
		});
	});
});

function failingProductReadDependencies(): ProductReadDependencies {
	const fail = async () => {
		throw new Error("Rejected product reads must not query products");
	};

	return {
		productRepo: {
			getProductCountByCategory: fail,
			getProductCountByStatus: fail,
			getProductsByIds: fail,
			getRecentProducts: fail,
		},
	};
}
