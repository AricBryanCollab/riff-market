import type { Order } from "generated/prisma/browser";
import { prisma } from "@/data/connectDb";

type CreateOrderRepoInput = Omit<Order, "id" | "createdAt" | "updatedAt">;

export const createOrder = async (order: CreateOrderRepoInput) => {
	try {
		return await prisma.order.create({
			data: {
				...order,
			},
		});
	} catch (err) {
		console.error("Error at createOrder", err);
		throw err;
	}
};
