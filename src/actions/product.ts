import type { Prisma } from "generated/prisma/client";
import {
	getApprovedProducts,
	getProductById,
	getProductCountByCategory,
	getProductCountByStatus,
	getProductsByIds,
	getProductsBySellerId,
	getRecentProducts,
} from "@/data/product-repo";
import {
	getProductQuerySchema,
	getProductsByIdsQuerySchema,
} from "@/lib/zod/product-validation";
import { toImageAssetUrls } from "@/utils/image-asset-ref";

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

export async function getProductByIdService(productId: string) {
	const product = await getProductById(productId);

	if (!product) {
		return { error: "Product not found" };
	}

	return toProductResponse(product);
}

export async function getProductsByIdsService(role: string, rawQuery: unknown) {
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

	const uniqueIds = Array.from(new Set(parsed.data.ids));
	const products = await getProductsByIds(uniqueIds);

	return toProductResponses(products);
}

export async function getProductsBySellerService(id: string, role: string) {
	const userId = id;
	if (role !== "SELLER" || !userId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const products = await getProductsBySellerId(userId);

	return toProductResponses(products);
}

export async function getApprovedProductsService(rawQuery: unknown) {
	const parsed = getProductQuerySchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid product queries",
			details: parsed.error,
		};
	}

	const validQuery = parsed.data;

	const products = await getApprovedProducts(validQuery);
	return toProductResponses(products);
}

export async function getProductCountByCategoryService() {
	return await getProductCountByCategory();
}

export async function getProductCountByStatusService(isApproved: boolean) {
	const count = await getProductCountByStatus(isApproved);

	return isApproved
		? { approvedProductCount: count }
		: { pendingProductCount: count };
}

export async function getRecentProductsService(limit: number = 8) {
	const products = await getRecentProducts(limit);
	return toProductResponses(products);
}
