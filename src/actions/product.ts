import {
	createProduct,
	deleteProductById,
	getApprovedProducts,
	getPendingApprovalProducts,
	getProductById,
	getProductCountByCategory,
	getProductCountByStatus,
	getProductsBySellerId,
	getRecentProducts,
	updateProductById,
	updateProductStatus,
} from "@/data/product.repo";
import { env } from "@/env";
import {
	type CreateProductInput,
	createProductSchema,
	getProductQuerySchema,
	type UpdateProductInput,
	updateProductSchema,
	updateProductStatusSchema,
} from "@/lib/zod/product.validation";
import {
	deleteImage,
	getPublicId,
	unsignedUploadImage,
} from "@/utils/cloudinary";
import { compressImage } from "@/utils/compress-image";

// Create Product Service
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

	try {
		for (const imageFile of data.images) {
			const compressedImage = await compressImage({
				file: imageFile,
				options: {
					maxSize: 2400,
					quality: 85,
					format: "jpeg",
				},
			});

			const uploadResult = await unsignedUploadImage({
				buffer: compressedImage.buffer,
				filename: imageFile.name,
				uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
				folder: "products",
			});

			imageUrls.push(uploadResult.secure_url);
		}
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

// Get Product By ID Service
export async function getProductByIdService(productId: string) {
	const product = await getProductById(productId);

	if (!product) {
		return { error: "Product not found" };
	}

	return product;
}

// Get Product By Seller Service
export async function getProductsBySellerService(id: string, role: string) {
	const userId = id;
	if (role !== "SELLER" || !userId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const products = await getProductsBySellerId(userId);

	return products;
}

// Get Approved Products
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

// Get Pending Products
export async function getPendingProductsService() {
	const products = await getPendingApprovalProducts();
	return products;
}

// Get Product Count By Category
export async function getProductCountByCategoryService() {
	return await getProductCountByCategory();
}

// Get Total Product Count
export async function getProductCountByStatusService(isApproved: boolean) {
	const count = await getProductCountByStatus(isApproved);

	return isApproved
		? { approvedProductCount: count }
		: { pendingProductCount: count };
}

// Get Recent Product Listed
export async function getRecentProductsService(limit: number = 8) {
	const products = await getRecentProducts(limit);
	return products;
}

//Update Product Service
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
			for (const imageFile of data.images) {
				const compressedImage = await compressImage({
					file: imageFile,
					options: {
						maxSize: 2400,
						quality: 85,
						format: "jpeg",
					},
				});

				const uploadResult = await unsignedUploadImage({
					buffer: compressedImage.buffer,
					filename: imageFile.name,
					uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
					folder: "products",
				});

				newImageUrls.push(uploadResult.secure_url);
			}

			imageUrls = newImageUrls;

			// Delete old images
			if (
				Array.isArray(existingProduct.images) &&
				existingProduct.images.length > 0
			) {
				await Promise.all(
					existingProduct.images.map((url) => {
						const publicId = getPublicId(url);
						return deleteImage(publicId);
					}),
				);
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

// Update Product Status Service
export async function updateProductStatusService(
	productId: string,
	rawData: { status: boolean },
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

// Delete Product Service
export async function deleteProductService(
	productId: string,
	sellerId: string,
) {
	if (!sellerId) {
		return { error: "User is unauthorized" };
	}

	const product = await getProductById(productId);
	if (!product) {
		return { error: "Product not found" };
	}

	if (Array.isArray(product.images) && product.images.length > 0) {
		try {
			await Promise.all(
				product.images.map(async (url) => {
					const publicId = getPublicId(url);
					return deleteImage(publicId);
				}),
			);
		} catch (error) {
			console.error("Failed to delete images from Cloudinary:", error);
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
