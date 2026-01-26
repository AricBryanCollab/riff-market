import { prisma } from "@/data/connectDb";
import { createNotification } from "@/data/notification";
import type { CreateOrderRepoData, OrderResponse } from "@/types/order";
import {
	orderBaseQuery,
	transformOrderResponse,
} from "@/utils/transformOrderQueryResponse";

// Create Order
export const createOrder = async (
	orderData: CreateOrderRepoData,
): Promise<OrderResponse> => {
	try {
		const { items, ...order } = orderData;

		const result = await prisma.$transaction(async (tx) => {
			const createdOrder = await tx.order.create({
				data: {
					userId: order.userId,
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

			for (const item of items) {
				await tx.product.update({
					where: { id: item.productId },
					data: {
						stock: {
							decrement: item.quantity,
						},
					},
				});
			}

			await createNotification(
				{
					userId: order.userId,
					orderId: createdOrder.id,
					message: `Your order #${order.trackingNumber} has been placed successfully! Total: $${order.totalAmount.toFixed(2)}`,
					isRead: false,
				},
				tx,
			);

			return createdOrder;
		});

		return transformOrderResponse(result);
	} catch (err) {
		console.error("Error at createOrder:", err);
		throw err;
	}
};

// Get Order By User
export const getUserOrders = async (userId: string) => {
	try {
		const orders = await prisma.order.findMany({
			where: { userId },
			orderBy: {
				orderDate: "desc",
			},
		});

		return orders;
	} catch (err) {
		console.error("Error at getUserOrders:", err);
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
		console.error("Error at getOrderById:", err);
		throw err;
	}
};
