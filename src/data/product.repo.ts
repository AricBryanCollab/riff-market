import type { Product } from "generated/prisma/client";
import { prisma } from "@/data/connectDb";

type CreateProductRepoInput = Omit<
	Product,
	"id" | "createdAt" | "updatedAt" | "isApproved"
>;

type UpdateProductRepoInput = Partial<
	Omit<Product, "id" | "sellerId" | "createdAt" | "updatedAt">
>;

// Create Product
export const createProduct = async (product: CreateProductRepoInput) => {
	try {
		return await prisma.product.create({
			data: {
				...product,
				isApproved: false,
			},
		});
	} catch (err) {
		console.error("Error at createProduct", err);
		throw err;
	}
};

// Get Products
const baseProductQuery = {
	id: true,
	sellerId: true,
	name: true,
	category: true,
	brand: true,
	model: true,
	images: true,
	description: true,
	price: true,
	stock: true,
	isApproved: true,
	createdAt: true,
	updatedAt: true,

	seller: {
		select: {
			firstName: true,
			lastName: true,
			email: true,
		},
	},
};

export const getProductById = async (id: string) => {
	try {
		return await prisma.product.findFirst({
			where: { id },
			select: baseProductQuery,
		});
	} catch (err) {
		console.error("Error at getProductById", err);
		throw err;
	}
};

export const getProductsByIds = async (productIds: string[]) => {
	try {
		const products = await prisma.product.findMany({
			where: {
				id: {
					in: productIds,
				},
			},
			select: baseProductQuery,
		});

		return products;
	} catch (err) {
		console.error("Error at findProductsByIds:", err);
		throw err;
	}
};

export const getProductsBySellerId = async (sellerId: string) => {
	try {
		return await prisma.product.findMany({
			where: { sellerId },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});
	} catch (err) {
		console.error("Error at getProductsBySellerId", err);
		throw err;
	}
};

export const getApprovedProducts = async () => {
	try {
		return await prisma.product.findMany({
			where: { isApproved: true },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});
	} catch (err) {
		console.error("Error at getApprovedProducts", err);
		throw err;
	}
};

export const getPendingApprovalProducts = async () => {
	try {
		return await prisma.product.findMany({
			where: { isApproved: false },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});
	} catch (err) {
		console.error("Error at getPendingApprovalProducts", err);
		throw err;
	}
};

// Update Product By ID
export const updateProductById = async (
	id: string,
	product: UpdateProductRepoInput,
): Promise<Product> => {
	try {
		return await prisma.product.update({
			where: { id },
			data: product,
		});
	} catch (err) {
		console.error("Error at updateProductById", err);
		throw err;
	}
};

// Update Product Status
export const updateProductStatus = async (id: string, status: boolean) => {
	try {
		if (!status) {
			await prisma.product.delete({
				where: { id },
			});
			return {
				id,
				name: null,
				isApproved: false,
			};
		}

		return await prisma.product.update({
			where: { id },
			data: {
				isApproved: status,
			},
			select: {
				id: true,
				name: true,
				isApproved: true,
			},
		});
	} catch (err) {
		console.error("Error at updateProductStatus", err);
		throw err;
	}
};

//  Delete Product By ID
export const deleteProductById = async (id: string) => {
	try {
		return await prisma.product.delete({
			where: { id },
		});
	} catch (err) {
		console.error("Error at deleteProductById", err);
		throw err;
	}
};
