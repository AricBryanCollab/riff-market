import type { Prisma } from "generated/prisma/client";
import { getProductsByIdsQuerySchema } from "@/lib/zod/product-validation";
import { toImageAssetUrls } from "@/utils/image-asset-ref";

export type ProductReadDependencies = {
	readonly productRepo: Pick<
		typeof import("@/data/product-repo"),
		| "getProductCountByCategory"
		| "getProductCountByStatus"
		| "getProductsByIds"
		| "getRecentProducts"
	>;
};

function toProductResponse<T extends { images: Prisma.JsonValue }>(
	product: T,
): Omit<T, "images"> & { images: string[] } {
	return {
		...product,
		images: toImageAssetUrls(product.images),
	};
}

function toProductResponses<T extends { images: Prisma.JsonValue }>(
	products: T[],
) {
	return products.map(toProductResponse);
}

export async function getProductsByIdsService(
	role: string,
	rawQuery: unknown,
	dependencies?: ProductReadDependencies,
) {
	if (role !== "CUSTOMER") {
		return { error: "Unauthorized, user must be a customer" };
	}

	const parsed = getProductsByIdsQuerySchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid product IDs query",
			details: parsed.error,
		};
	}

	const readDependencies =
		dependencies ?? (await createDefaultProductReadDependencies());
	const uniqueIds = Array.from(new Set(parsed.data.ids));
	const products =
		await readDependencies.productRepo.getProductsByIds(uniqueIds);

	return toProductResponses(products);
}

export async function getProductCountByCategoryService(
	dependencies?: ProductReadDependencies,
) {
	const readDependencies =
		dependencies ?? (await createDefaultProductReadDependencies());
	return await readDependencies.productRepo.getProductCountByCategory();
}

export async function getProductCountByStatusService(
	isApproved: boolean,
	dependencies?: ProductReadDependencies,
) {
	const readDependencies =
		dependencies ?? (await createDefaultProductReadDependencies());
	const count =
		await readDependencies.productRepo.getProductCountByStatus(isApproved);

	return isApproved
		? { approvedProductCount: count }
		: { pendingProductCount: count };
}

export async function getRecentProductsService(
	limit: number = 8,
	dependencies?: ProductReadDependencies,
) {
	const readDependencies =
		dependencies ?? (await createDefaultProductReadDependencies());
	const products = await readDependencies.productRepo.getRecentProducts(limit);
	return toProductResponses(products);
}

async function createDefaultProductReadDependencies(): Promise<ProductReadDependencies> {
	const productRepo = await import("@/data/product-repo");

	return { productRepo };
}
