import { prisma } from "@/data/connectDb";
import type { OrderRequest } from "@/types/order";

export const createOrder = async (order: OrderRequest) => {
	try {
		const { userId, shippingAddress, paymentMethod, items } = order;

		return await prisma.$transaction(async (tx) => {
			const products = await tx.product.findMany({
				where: {
					id: { in: items.map((i) => i.productId) },
					isApproved: true,
				},
			});

			if (products.length !== items.length) {
				throw new Error("One or more products are invalid or unavailable");
			}

			const orderItemsData = items.map((item) => {
				const product = products.find((p) => p.id === item.productId)!;

				if (product.stock < item.quantity) {
					throw new Error(`Insufficient stock for ${product.name}`);
				}

				return {
					productId: product.id,
					quantity: item.quantity,
					unitPrice: product.price,
					subTotal: product.price * item.quantity,
				};
			});
		});
	} catch (err) {
		console.error("Error at createOrder", err);
		throw err;
	}
};
