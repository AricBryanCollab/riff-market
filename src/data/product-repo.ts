import type { Prisma } from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import {
	normalizeProductMoney,
	type ProductMoneySource,
	toProductPriceRangePersistence,
} from "@/domains/listings/application/product-money";
import { logger } from "@/lib/logger";
import type { GetProductQuery } from "@/lib/zod/product-validation";
import type { ProductCategory, ProductCondition } from "@/types/enum";

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
	priceCents: true,
	currencyCode: true,
	stock: true,
	isApproved: true,
	listingStatus: true,
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

		return product ? normalizeProductMoney(product) : product;
	} catch (err) {
		logger.error("Error at getProductById", err);
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

		return normalizeProductsMoney(products);
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

		return normalizeProductsMoney(products);
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
	priceMinCents,
	priceMaxCents,
}: GetProductQuery) => {
	try {
		const priceRange = toProductPriceRangePersistence({
			priceMinCents,
			priceMaxCents,
		});
		const whereClause: Prisma.ProductWhereInput = {
			listingStatus: "APPROVED",
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
			...(priceRange && {
				AND: [
					{
						OR: [
							{ priceCents: priceRange.priceCents },
							{
								priceCents: null,
								price: priceRange.legacyPrice,
							},
						],
					},
				],
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

			return normalizeProductsMoney(products);
		}

		const products = await prisma.product.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
			take: limit,
			skip: offset,
		});

		return normalizeProductsMoney(products);
	} catch (err) {
		logger.error("Error at getApprovedProducts", err);
		throw err;
	}
};

export const getPendingApprovalProducts = async () => {
	try {
		const products = await prisma.product.findMany({
			where: { listingStatus: "PENDING" },
			orderBy: { createdAt: "desc" },
			select: baseProductQuery,
		});

		return normalizeProductsMoney(products);
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
				listingStatus: "APPROVED",
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
				listingStatus: isApproved ? "APPROVED" : "PENDING",
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
			where: { listingStatus: "APPROVED" },
			orderBy: { updatedAt: "desc" },
			select: baseProductQuery,
			take: limit,
		});

		return normalizeProductsMoney(products);
	} catch (err) {
		logger.error("Error at getRecentProducts", err);
		throw err;
	}
};

function normalizeProductsMoney<T extends ProductMoneySource>(products: T[]) {
	return products.map(normalizeProductMoney);
}
