import type { OrderStatus } from "generated/prisma/enums";

import { prisma } from "@/data/connect-db";
import { createNotification } from "@/data/notification-repo";
import {
	ListBuyerPurchaseHistory,
	ListSellerOrderDashboard,
} from "@/domains/ordering/application/order-read-models";
import { PrismaOrderReadModels } from "@/domains/ordering/infrastructure/prisma-order-read-models";
import type { ActorRole } from "@/domains/shared/domain/actor";
import { logger } from "@/lib/logger";
import type { CreateOrderRepoData, OrderResponse } from "@/types/order";
import { transformOrderResponse } from "@/utils/transform-order-query-response";

const orderBaseQuery = {
	items: {
		include: {
			product: {
				select: {
					id: true,
					name: true,
					images: true,
					price: true,
					seller: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true,
						},
					},
				},
			},
		},
	},
	user: {
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
		},
	},
} as const;

export const createOrder = async (
	userId: string,
	orderData: CreateOrderRepoData,
): Promise<OrderResponse> => {
	try {
		const { items, ...order } = orderData;

		// Create Order Transaction
		const result = await prisma.$transaction(async (tx) => {
			const createdOrder = await tx.order.create({
				data: {
					userId: userId,
					orderDate: order.orderDate,
					totalAmount: order.totalAmount,
					shippingAddress: order.shippingAddress,
					paymentMethod: order.paymentMethod,
					trackingNumber: order.trackingNumber,
					items: {
						create: items.map((item) => ({
							productId: item.productId,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							subTotal: item.subTotal,
						})),
					},
				},
				include: orderBaseQuery,
			});

			// Obtain Seller IDs from the Product
			const productIds = items.map((item) => item.productId);
			const products = await tx.product.findMany({
				where: { id: { in: productIds } },
				select: { id: true, sellerId: true, name: true },
			});

			const productMap = new Map(products.map((p) => [p.id, p]));
			const sellerNotifications = new Map<
				string,
				{ productNames: string[]; totalAmount: number }
			>();

			for (const item of items) {
				await tx.product.update({
					where: { id: item.productId },
					data: {
						stock: {
							decrement: item.quantity,
						},
					},
				});

				// Aggregate Seller Data
				const product = productMap.get(item.productId);
				if (product) {
					const existing = sellerNotifications.get(product.sellerId);
					if (existing) {
						existing.productNames.push(product.name);
						existing.totalAmount += item.subTotal;
					} else {
						sellerNotifications.set(product.sellerId, {
							productNames: [product.name],
							totalAmount: item.subTotal,
						});
					}
				}
			}

			// Notify CUSTOMER
			await createNotification(
				{
					userId: userId,
					message: `Your order #${order.trackingNumber} has been placed successfully! Total: $${order.totalAmount.toFixed(2)}`,
					isRead: false,
				},
				tx,
			);

			// Notify each SELLER
			for (const [sellerId, data] of sellerNotifications) {
				const productList = data.productNames.join(", ");
				await createNotification(
					{
						userId: sellerId,
						message: `New order received! Order #${order.trackingNumber} Products: ${productList}  Amount: $${data.totalAmount.toFixed(2)}`,
						isRead: false,
					},
					tx,
				);
			}

			return createdOrder;
		});

		return transformOrderResponse(result);
	} catch (err) {
		logger.error("Error at createOrder", err);
		throw err;
	}
};

// Get Order By Customer
export const getCustomerOrders = async (userId: string) => {
	try {
		const result = await new ListBuyerPurchaseHistory(
			new PrismaOrderReadModels(prisma),
		).execute({
			id: userId,
			role: "CUSTOMER",
		});

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	} catch (err) {
		logger.error("Error at getCustomerOrders", err);
		throw err;
	}
};

// Get Order By Seller
export const getSellerOrders = async (
	userId: string,
	role: Extract<ActorRole, "SELLER" | "ADMIN"> = "SELLER",
) => {
	try {
		const result = await new ListSellerOrderDashboard(
			new PrismaOrderReadModels(prisma),
		).execute({
			id: userId,
			role,
		});

		if (!result.ok) {
			throw new Error(result.error.message);
		}

		return result.value;
	} catch (err) {
		logger.error("Error at getSellerOrders", err);
		throw err;
	}
};

// Get Order By ID
export const getOrderById = async (orderId: string) => {
	try {
		return await prisma.order.findFirst({
			where: { id: orderId },
			include: orderBaseQuery,
		});
	} catch (err) {
		logger.error("Error at getOrderById", err);
		throw err;
	}
};

// Update OrderStatus
export const updateOrderStatus = async (
	orderId: string,
	status: OrderStatus,
) => {
	try {
		return await prisma.order.update({
			where: { id: orderId },
			data: {
				status,
			},
		});
	} catch (err) {
		logger.error("Error at updateOrderStatus", err);
		throw err;
	}
};
