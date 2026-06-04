import type { Order, OrderItem, Product, User } from "generated/prisma/client";
import type { OrderResponse } from "@/types/order";
import { toImageAssetUrls } from "@/utils/image-asset-ref";

type OrderProduct = Pick<Product, "id" | "name" | "images" | "price"> & {
	seller: Pick<User, "id" | "firstName" | "lastName" | "email">;
};

type PrismaOrderWithRelations = Order & {
	items: Array<OrderItem & { product: OrderProduct }>;
	user: Pick<User, "id" | "email" | "firstName" | "lastName">;
};

export function transformOrderResponse(
	order: PrismaOrderWithRelations,
): OrderResponse {
	const { user, ...rest } = order;
	return {
		...rest,
		items: rest.items.map((item) => ({
			...item,
			product: {
				...item.product,
				images: toImageAssetUrls(item.product.images),
			},
		})),
		customer: user,
	};
}
