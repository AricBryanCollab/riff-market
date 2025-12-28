import {
	createProduct,
	deleteProductById,
	getApprovedProducts,
	getProductById,
	getProductsBySellerId,
	updateProductById,
} from "@/data/product.repo";
import {
	type CreateProductInput,
	createProductSchema,
	updateProductSchema,
} from "@/lib/zod/product.validation";
import { useAppSession } from "@/utils/session";

// Create Product Service
export async function createProductService(rawData: CreateProductInput) {
	const session = await useAppSession();
	const parsed = createProductSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to create product",
			details: parsed.error,
		};
	}

	const data = parsed.data;

	const sellerId = session.data.userId;
	if (!sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const productData = {
		...data,
		price: Number(data.price),
		stock: Number(data.stock),
		sellerId,
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
export async function getProductsBySellerService() {
	const session = await useAppSession();
	const sellerId = session.data.userId;

	if (!sellerId) {
		return { error: "User is unauthorized" };
	}

	const products = await getProductsBySellerId(sellerId);

	return products;
}

// Get Approved Products
export async function getApprovedProductsService() {
	const products = await getApprovedProducts();
	return products;
}

// Update Product Service
// export async function updateProductService(
// 	productId: string,
// 	rawData: UpdateProductRequest,
// ) {
// 	const session = await useAppSession();
// 	const sellerId = session.data.userId;

// 	if (!sellerId) {
// 		return { error: "User is unauthorized" };
// 	}

// 	const parsed = updateProductSchema.safeParse(rawData);
// 	if (!parsed.success) {
// 		return {
// 			error: "Invalid product update data",
// 			details: parsed.error,
// 		};
// 	}

// 	const data = parsed.data;

// 	const isExistingProduct = await getProductById(productId);
// 	if (!isExistingProduct) {
// 		return { error: "Product not found" };
// 	}

// 	if (isExistingProduct.sellerId !== sellerId) {
// 		return {
// 			error: "Product is not owned by the current user ID, unauthorized access",
// 		};
// 	}

// 	if (data.image && data.image.length > 0) {
// 		const uploadedImages = await Promise.all(
// 			data.image.map((img) =>
// 				uploadImage({
// 					filePath: img,
// 					folder: "products",
// 					deleteLocalFile: true,
// 				}),
// 			),
// 		);

// 		const newImageUrls = uploadedImages.map((img) => img.url);

// 		if (Array.isArray(isExistingProduct.images)) {
// 			await Promise.all(
// 				isExistingProduct.images.map((url) => {
// 					const publicId = getPublicId(url);
// 					return deleteImage(publicId);
// 				}),
// 			);
// 		}

// 		data.image = newImageUrls;
// 	}

// 	const updatedProduct = await updateProductById(productId, data);

// 	return updatedProduct;
// }

// Delete Product Service
export async function deleteProductService(productId: string) {
	const session = await useAppSession();
	const sellerId = session.data.userId;

	if (!sellerId) {
		return { error: "Unauthorized" };
	}

	const product = await getProductById(productId);
	if (!product) {
		return { error: "Product not found" };
	}

	if (product.sellerId !== sellerId) {
		return {
			error: "Product is not owned by the current user ID, unauthorized access",
		};
	}

	// if (Array.isArray(product.images) && product.images.length > 0) {
	// 	await Promise.all(
	// 		product.images.map((url) => {
	// 			const publicId = getPublicId(url);
	// 			return deleteImage(publicId);
	// 		}),
	// 	);
	// }

	await deleteProductById(productId);

	return { message: "Product deleted successfully" };
}
