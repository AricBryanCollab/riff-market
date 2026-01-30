import type { Product } from "generated/prisma/client";
import { prisma } from "@/data/connectDb";
import type { ApprovedProductQueryOptions } from "@/types/product";

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

// Get Products Base Query
const baseProductQuery = {
	id: true,
	sellerId: true,
	name: true,
	category: true,
	condition: true,
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

// Get Product By ID
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

// Get Multiple Product By IDs
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

// Get Product By Seller
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

// Get Approved Products
export const getApprovedProducts = async ({
	limit = 12,
	offset = 0,
	random = false,
}: Partial<ApprovedProductQueryOptions>) => {
	try {
		if (random) {
			const total = await prisma.product.count({
				where: { isApproved: true },
			});

			const randomSkip =
				total > limit ? Math.floor(Math.random() * (total - limit)) : 0;

			return await prisma.product.findMany({
				where: { isApproved: true },
				select: baseProductQuery,
				take: limit,
				skip: randomSkip,
			});
		}

		return await prisma.product.findMany({
			where: { isApproved: true },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
			take: limit,
			skip: offset,
		});
	} catch (err) {
		console.error("Error at getApprovedProducts", err);
		throw err;
	}
};

//  Get Pending Approval Products
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

// Get Product Count By Category
export const getProductCountByCategory = async () => {
	try {
		const groupedProducts = await prisma.product.groupBy({
			by: ["category"],
			where: {
				isApproved: true,
			},
			_count: {
				category: true,
			},
		});

		return groupedProducts.map((product) => ({
			category: product.category,
			count: product._count.category,
		}));
	} catch (err) {
		console.error("Error at getProductCountByCategory", err);
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
