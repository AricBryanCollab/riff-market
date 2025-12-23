import {
	createProduct,
	getApprovedProducts,
	getProductById,
	getProductsBySellerId,
} from "@/data/product.repo";
import {
	type CreateProductInput,
	createProductSchema,
} from "@/lib/zod/product.validation";
import type { CreateProductRequest } from "@/types/product";
import { uploadImage } from "@/utils/cloudinary";
import { useAppSession } from "@/utils/session";

// Create Product Service
export async function createProductService(rawData: CreateProductRequest) {
	const session = await useAppSession();
	const parsed = createProductSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to create product",
			details: parsed.error,
		};
	}

	const data: CreateProductInput = parsed.data;

	const sellerId = session.data.userId;
	if (!sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const uploadedImages = await Promise.all(
		data.image.map((img) =>
			uploadImage({ filePath: img, folder: "products", deleteLocalFile: true }),
		),
	);

	const imageUrls = uploadedImages.map((img) => img.url);

	const productData = {
		...data,
		sellerId,
		image: imageUrls,
	};

	const newProduct = await createProduct(productData);

	return { message: "Product created successfully", newProduct };
}

// Get Product By ID Service
export async function getProductByIdService(productId: string) {
	const product = await getProductById(productId);

	if (!product) {
		return { error: "Product not found" };
	}

	return { product };
}

// Get Product By Seller Service
export async function getProductsBySellerService() {
	const session = await useAppSession();
	const sellerId = session.data.userId;

	if (!sellerId) {
		return { error: "User is unauthorized" };
	}

	const products = await getProductsBySellerId(sellerId);

	return { products };
}

// Get Approved Products
export async function getApprovedProductsService() {
	const products = await getApprovedProducts();
	return { products };
}
