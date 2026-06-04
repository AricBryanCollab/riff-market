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
import { env } from "@/env";
import { logger } from "@/lib/logger";
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
import { unsignedUploadImage } from "@/utils/cloudinary";
import {
	deleteCloudinaryImageAssets,
	tryDeleteCloudinaryImageAssets,
} from "@/utils/cloudinary-assets";
import { compressImage } from "@/utils/compress-image";

const MAX_PRODUCT_IMAGE_UPLOADS = 3;
const productImageOptions = {
	maxSize: 2400,
	quality: 85,
	format: "jpeg",
} as const;

type ProductImageUploadResult = {
	secure_url?: string;
	error?: string;
};
const UNAUTHORIZED_PRODUCT_MODIFICATION =
	"Unauthorized, user cannot modify this product";

async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	mapFn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	// This uses bounded async worker loops (via Promise workers), not Browser Worker API.
	// Each worker grabs the next pending item and processes it until none remain.
	if (items.length === 0) {
		return [];
	}

	const normalizedConcurrency = Math.max(
		1,
		Math.min(concurrency, items.length),
	);
	const results = new Array<R>(items.length);
	let nextIndex = 0;

	const worker = async () => {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await mapFn(items[index], index);
		}
	};

	await Promise.all(
		Array.from({ length: normalizedConcurrency }, () => worker()),
	);

	return results;
}

async function uploadProductImage(imageFile: File) {
	const compressedImage = await compressImage({
		file: imageFile,
		options: productImageOptions,
	});

	const uploadResult = (await unsignedUploadImage({
		buffer: compressedImage.buffer,
		filename: imageFile.name,
		uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
		folder: "products",
	})) as ProductImageUploadResult;

	if (!uploadResult || !uploadResult.secure_url) {
		const message =
			uploadResult && "error" in uploadResult
				? uploadResult.error || "Cloudinary upload failed"
				: "Cloudinary upload failed";

		throw new Error(message);
	}

	return uploadResult.secure_url;
}

async function cleanupUploadedImages(imageUrls: string[]) {
	if (imageUrls.length === 0) {
		return;
	}

	await tryDeleteCloudinaryImageAssets(imageUrls);
}

async function uploadProductImages(imageFiles: File[]) {
	const uploadedImageUrls: string[] = [];

	try {
		const urls = await mapWithConcurrency(
			imageFiles,
			MAX_PRODUCT_IMAGE_UPLOADS,
			async (imageFile) => {
				const url = await uploadProductImage(imageFile);
				uploadedImageUrls.push(url);
				return url;
			},
		);

		return urls;
	} catch (error) {
		await cleanupUploadedImages(uploadedImageUrls);
		throw error;
	}
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

	const imageUrls: string[] = [];
	const imageFiles = data.images;

	try {
		// Upload image pipelines with bounded parallelism (max 3 at once).
		const uploadedUrls = await uploadProductImages(imageFiles);

		imageUrls.push(...uploadedUrls);
	} catch (error) {
		return {
			error: "Failed to upload images",
			details: error instanceof Error ? error.message : "Unknown error",
		};
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
		images: imageUrls,
		sellerId: sellerId,
	};

	const newProduct = await createProduct(productData);

	return newProduct;
}

export async function getProductByIdService(productId: string) {
	const product = await getProductById(productId);

	if (!product) {
		return { error: "Product not found" };
	}

	return product;
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

	return products;
}

export async function getProductsBySellerService(id: string, role: string) {
	const userId = id;
	if (role !== "SELLER" || !userId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const products = await getProductsBySellerId(userId);

	return products;
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
	return products;
}

export async function getPendingProductsService() {
	const products = await getPendingApprovalProducts();
	return products;
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
	return products;
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

	let imageUrls: string[] = existingProduct.images;

	if (data.images && data.images.length > 0) {
		const newImageUrls: string[] = [];

		try {
			// Upload image pipelines with bounded parallelism (max 3 at once).
			const uploadedUrls = await uploadProductImages(data.images);

			newImageUrls.push(...uploadedUrls);

			imageUrls = newImageUrls;

			// Delete old images
			if (
				Array.isArray(existingProduct.images) &&
				existingProduct.images.length > 0
			) {
				await deleteCloudinaryImageAssets(existingProduct.images);
			}
		} catch (error) {
			return {
				error: "Failed to upload images",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	const updateData = {
		...(data.name && { name: data.name }),
		...(data.category && { category: data.category }),
		...(data.brand && { brand: data.brand }),
		...(data.model && { model: data.model }),
		...(data.description && { description: data.description }),
		...(data.price && { price: Number(data.price) }),
		...(data.stock !== undefined && { stock: Number(data.stock) }),
		images: imageUrls,
		isApproved: role === "ADMIN",
	};

	const updatedProduct = await updateProductById(productId, updateData);

	if (!updatedProduct) {
		return {
			error: "Failed to update the product",
		};
	}

	return updatedProduct;
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

	if (Array.isArray(product.images) && product.images.length > 0) {
		try {
			await deleteCloudinaryImageAssets(product.images);
		} catch (error) {
			logger.error("Failed to delete images from Cloudinary", error);
			return {
				error: "Failed to delete product images",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	const deletedProduct = await deleteProductById(productId);

	if (!deletedProduct) {
		return {
			error: "Failed to delete the product",
		};
	}

	return { message: "Product deleted successfully" };
}
