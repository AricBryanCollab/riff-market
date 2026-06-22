import { prisma } from "@/data/connect-db";
import {
	normalizeProductMoney,
	type ProductMoneySource,
} from "@/domains/listings/application/product-money";
import { logger } from "@/lib/logger";

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
