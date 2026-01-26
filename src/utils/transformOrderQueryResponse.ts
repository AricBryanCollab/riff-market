import { prisma } from "@/data/connectDb";
import type { OrderResponse } from "@/types/order";

type InferOrderResult = Awaited<ReturnType<typeof getOrderSample>>;

type PrismaOrderWithRelations = NonNullable<InferOrderResult>;

// Order Base Query
export const orderBaseQuery = {
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

async function getOrderSample() {
	return await prisma.order.findFirst({
		include: orderBaseQuery,
	});
}

// Utility function to change the key user as customer
export function transformOrderResponse(
	order: PrismaOrderWithRelations,
): OrderResponse {
	const { user, ...rest } = order;
	return {
		...rest,
		customer: user,
	};
}
