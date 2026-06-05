import type { Prisma } from "generated/prisma/client";
import {
	createProduct,
	deleteProductById,
	getApprovedProducts,
	getPendingApprovalProducts,
	getProductById,
	getProductCountByCategory,
	getProductCountByStatus,
	getProductsByIds,
	getProductsBySellerId,
	getRecentProducts,
	updateProductById,
	updateProductStatus,
} from "@/data/product-repo";
import {
	type CreateProductInput,
	createProductSchema,
	getProductQuerySchema,
	getProductsByIdsQuerySchema,
	type UpdateProductInput,
	type UpdateProductStatusInput,
	updateProductSchema,
	updateProductStatusSchema,
} from "@/lib/zod/product-validation";
import { toImageAssetUrls } from "@/utils/image-asset-ref";
import {
	createProductWithImages,
	deleteProductWithImages,
	isProductImageUploadError,
	replaceProductImages,
} from "./product-image-assets";

const UNAUTHORIZED_PRODUCT_MODIFICATION =
	"Unauthorized, user cannot modify this product";

type ProductUpdateResult =
	| Awaited<ReturnType<typeof updateProductById>>
	| null
	| undefined;

function toProductImageUploadErrorResponse(error: unknown) {
	if (!isProductImageUploadError(error)) {
		throw error;
	}

	return {
		error: "Failed to upload images",
		details: error.message,
	};
}

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

export async function createProductService(
	sellerId: string,
	authRole: string,
	rawData: CreateProductInput,
) {
	const parsed = createProductSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to create product",
			details: parsed.error,
		};
	}

	const data = parsed.data;
	const isAdmin = authRole === "ADMIN";
	const isSeller = authRole === "SELLER";

	if ((!isAdmin && !isSeller) || !sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const productData = {
		name: data.name,
		category: data.category,
		brand: data.brand,
		condition: data.condition,
		model: data.model,
		description: data.description,
		price: Number(data.price),
		stock: Number(data.stock),
		sellerId: sellerId,
	};

	try {
		const newProduct = await createProductWithImages({
			imageFiles: data.images,
			persistProduct: (images) =>
				createProduct({
					...productData,
					images,
				}),
		});

		return toProductResponse(newProduct);
	} catch (error) {
		return toProductImageUploadErrorResponse(error);
	}
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

export async function getPendingProductsService() {
	const products = await getPendingApprovalProducts();
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

export async function updateProductService(
	productId: string,
	sellerId: string,
	role: string,
	rawData: UpdateProductInput,
) {
	if (!sellerId) {
		return { error: "User is unauthorized" };
	}

	const existingProduct = await getProductById(productId);
	if (!existingProduct) {
		return { error: "Product not found" };
	}

	const isAuthorizedModifier =
		role === "ADMIN" ||
		(role === "SELLER" && existingProduct.sellerId === sellerId);

	if (!isAuthorizedModifier) {
		return { error: UNAUTHORIZED_PRODUCT_MODIFICATION };
	}

	const parsed = updateProductSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to update product",
			details: parsed.error,
		};
	}

	const data = parsed.data;

	const updateData = {
		...(data.name && { name: data.name }),
		...(data.category && { category: data.category }),
		...(data.brand && { brand: data.brand }),
		...(data.model && { model: data.model }),
		...(data.description && { description: data.description }),
		...(data.price && { price: Number(data.price) }),
		...(data.stock !== undefined && { stock: Number(data.stock) }),
		isApproved: role === "ADMIN",
	};

	let updatedProduct: ProductUpdateResult;

	if (data.images && data.images.length > 0) {
		try {
			updatedProduct = await replaceProductImages({
				currentImagesValue: existingProduct.images,
				imageFiles: data.images,
				persistProductImages: (images) =>
					updateProductById(productId, {
						...updateData,
						images,
					}),
			});
		} catch (error) {
			return toProductImageUploadErrorResponse(error);
		}
	} else {
		updatedProduct = await updateProductById(productId, updateData);
	}

	if (!updatedProduct) {
		return {
			error: "Failed to update the product",
		};
	}

	return toProductResponse(updatedProduct);
}

export async function updateProductStatusService(
	productId: string,
	rawData: UpdateProductStatusInput,
) {
	const product = await getProductById(productId);
	if (!product) {
		return { error: "Product not found" };
	}

	const parsed = updateProductStatusSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data for update product status",
			details: parsed.error,
		};
	}

	const updatedProductStatus = await updateProductStatus(
		productId,
		product.sellerId,
		product.name,
		parsed.data.isApproved,
	);

	if (!updatedProductStatus) {
		return { error: "Failed to update the product status" };
	}

	return updatedProductStatus;
}

export async function deleteProductService(
	productId: string,
	sellerId: string,
	role: string,
) {
	if (!sellerId) {
		return { error: "User is unauthorized" };
	}

	const product = await getProductById(productId);
	if (!product) {
		return { error: "Product not found" };
	}

	const isAuthorizedModifier =
		role === "ADMIN" || (role === "SELLER" && product.sellerId === sellerId);

	if (!isAuthorizedModifier) {
		return { error: UNAUTHORIZED_PRODUCT_MODIFICATION };
	}

	const deletedProduct = await deleteProductWithImages({
		currentImagesValue: product.images,
		deleteProduct: () => deleteProductById(productId),
	});

	if (!deletedProduct) {
		return {
			error: "Failed to delete the product",
		};
	}

	return { message: "Product deleted successfully" };
}
