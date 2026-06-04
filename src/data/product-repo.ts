import type { Prisma, Product } from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import { logger } from "@/lib/logger";
import type { GetProductQuery } from "@/lib/zod/product-validation";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import { createNotification } from "./notification-repo";

type CreateProductRepoInput = Omit<
	Product,
	"id" | "createdAt" | "updatedAt" | "isApproved" | "images"
> & {
	images: Prisma.InputJsonValue;
};

type UpdateProductRepoInput = Partial<
	Omit<Product, "id" | "sellerId" | "createdAt" | "updatedAt" | "images"> & {
		images: Prisma.InputJsonValue;
	}
>;

export const createProduct = async (product: CreateProductRepoInput) => {
	try {
		return await prisma.product.create({
			data: {
				...product,
				isApproved: false,
			},
		});
	} catch (err) {
		logger.error("Error at createProduct", err);
		throw err;
	}
};

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

export const getProductById = async (id: string) => {
	try {
		const product = await prisma.product.findFirst({
			where: { id },
			select: baseProductQuery,
		});

		return product;
	} catch (err) {
		logger.error("Error at getProductById", err);
		throw err;
	}
};

export const getProductImageValuesById = async (
	id: string,
): Promise<Prisma.JsonValue | null> => {
	try {
		const product = await prisma.product.findFirst({
			where: { id },
			select: { images: true },
		});

		return product?.images ?? null;
	} catch (err) {
		logger.error("Error at getProductImageValuesById", err);
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
		logger.error("Error at findProductsByIds:", err);
		throw err;
	}
};

export const getProductsBySellerId = async (sellerId: string) => {
	try {
		const products = await prisma.product.findMany({
			where: { sellerId },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});

		return products;
	} catch (err) {
		logger.error("Error at getProductsBySellerId", err);
		throw err;
	}
};

export const getApprovedProducts = async ({
	limit = 12,
	offset = 0,
	random = false,
	category,
	condition,
	brand,
	search,
	priceMin,
	priceMax,
}: GetProductQuery) => {
	try {
		const whereClause: Prisma.ProductWhereInput = {
			isApproved: true,
			...(category && { category: category as ProductCategory }),
			...(condition && { condition: condition as ProductCondition }),
			...(brand && { brand: { contains: brand, mode: "insensitive" } }),
			...(search && {
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{ description: { contains: search, mode: "insensitive" } },
					{ brand: { contains: search, mode: "insensitive" } },
					{ model: { contains: search, mode: "insensitive" } },
				],
			}),
			...((priceMin !== undefined || priceMax !== undefined) && {
				price: {
					...(priceMin !== undefined && { gte: priceMin }),
					...(priceMax !== undefined && { lte: priceMax }),
				},
			}),
		};

		if (random) {
			const total = await prisma.product.count({
				where: whereClause,
			});

			const randomSkip =
				total > limit ? Math.floor(Math.random() * (total - limit)) : 0;

			const products = await prisma.product.findMany({
				where: whereClause,
				select: baseProductQuery,
				take: limit,
				skip: randomSkip,
			});

			return products;
		}

		const products = await prisma.product.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
			take: limit,
			skip: offset,
		});

		return products;
	} catch (err) {
		logger.error("Error at getApprovedProducts", err);
		throw err;
	}
};

export const getPendingApprovalProducts = async () => {
	try {
		const products = await prisma.product.findMany({
			where: { isApproved: false },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});

		return products;
	} catch (err) {
		logger.error("Error at getPendingApprovalProducts", err);
		throw err;
	}
};

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
		logger.error("Error at getProductCountByCategory", err);
		throw err;
	}
};

export const getProductCountByStatus = async (isApproved: boolean) => {
	try {
		const productCount = await prisma.product.count({
			where: {
				isApproved,
			},
		});

		return productCount;
	} catch (err) {
		logger.error("Error at getProductCountByStatus", err);
		throw err;
	}
};

export const getRecentProducts = async (limit: number = 8) => {
	try {
		const products = await prisma.product.findMany({
			where: { isApproved: true },
			orderBy: { updatedAt: "desc" },
			select: baseProductQuery,
			take: limit,
		});

		return products;
	} catch (err) {
		logger.error("Error at getRecentProducts", err);
		throw err;
	}
};

export const updateProductById = async (
	id: string,
	product: UpdateProductRepoInput,
) => {
	try {
		const { images, ...productWithoutImages } = product;
		const updateData = {
			...productWithoutImages,
			...(images ? { images } : {}),
		};

		const updatedProduct = await prisma.product.update({
			where: { id },
			data: updateData,
			include: {
				seller: {
					select: {
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
		});

		return updatedProduct;
	} catch (err) {
		logger.error("Error at updateProductById", err);
		throw err;
	}
};

export const updateProductStatus = async (
	id: string,
	sellerId: string,
	productName: string,
	status: boolean,
) => {
	try {
		if (!status) {
			await prisma.product.delete({
				where: { id },
			});

			await createNotification({
				userId: sellerId,
				message: `Your product ${productName} has been declined by the admin & removed from RiffMarket`,
				isRead: false,
			});

			return {
				id,
				name: productName,
				isApproved: false,
			};
		}

		const approvedProduct = await prisma.product.update({
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

		await createNotification({
			userId: sellerId,
			message: `Great News! Your product ${productName} has been approved and live at the RiffMarket shop`,
			isRead: false,
		});

		return approvedProduct;
	} catch (err) {
		logger.error("Error at updateProductStatus", err);
		throw err;
	}
};

export const deleteProductById = async (id: string) => {
	try {
		return await prisma.product.delete({
			where: { id },
		});
	} catch (err) {
		logger.error("Error at deleteProductById", err);
		throw err;
	}
};
