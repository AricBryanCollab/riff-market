import { prisma } from "@/data/connectDb";
import { createNotification } from "@/data/notification";
import type { CreateOrderRepoData, OrderResponse } from "@/types/order";

export const createOrder = async (orderData: CreateOrderRepoData) => {
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
				include: {
					items: {
						include: {
							product: {
								select: {
									id: true,
									name: true,
									images: true,
									price: true,
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
				},
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

		return result;
	} catch (err) {
		console.error("Error at createOrder:", err);
		throw err;
	}
};

export const getUserOrders = async (
	userId: string,
): Promise<OrderResponse[]> => {
	try {
		const orders = await prisma.order.findMany({
			where: { userId },
			include: {
				items: {
					include: {
						product: {
							select: {
								id: true,
								name: true,
								images: true,
								price: true,
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
			},
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
