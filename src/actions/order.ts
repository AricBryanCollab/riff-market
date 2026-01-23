import { createOrder } from "@/data/order.repo";
import { getProductsByIds } from "@/data/product.repo";
import {
	type PlaceOrderInput,
	placeOrderSchema,
} from "@/lib/zod/order.validation";
import type {
	CreateOrderRepoData,
	OrderErrorResponse,
	OrderResponse,
} from "@/types/order";

import { generateTrackingNumber } from "@/utils/generateTrackingNumber";

export async function createOrderService(
	userId: string,
	role: string,
	rawData: PlaceOrderInput,
): Promise<OrderResponse | OrderErrorResponse> {
	if (!userId) {
		return { error: "User ID not found" };
	}

	if (role !== "CUSTOMER") {
		return {
			error:
				"Unauthorized, only user with customer role are allowed to place order",
		};
	}

	const parsed = placeOrderSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to place order",
			details: parsed.error,
		};
	}

	const data = parsed.data;

	const trackingNumber = generateTrackingNumber();

	const productIds = data.items.map((item) => item.productId);
	const products = await getProductsByIds(productIds);

	if (products.length !== productIds.length) {
		return { error: "One or more products not found" };
	}

	const orderItems = [];
	let totalAmount = 0;

	for (const item of data.items) {
		const product = products.find((p) => p.id === item.productId);

		if (!product) {
			return { error: `Product ${item.productId} not found` };
		}

		if (!product.isApproved) {
			return {
				error: `Product ${product.name} is not approved for sale`,
			};
		}

		if (product.stock < item.quantity) {
			return {
				error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
			};
		}

		const subTotal = product.price * item.quantity;
		totalAmount += subTotal;

		orderItems.push({
			productId: product.id,
			quantity: item.quantity,
			unitPrice: product.price,
			subTotal,
		});
	}

	const orderData: CreateOrderRepoData = {
		userId: userId,
		orderDate: new Date(),
		totalAmount,
		shippingAddress: data.shippingAddress,
		paymentMethod: data.paymentMethod,
		trackingNumber,
		items: orderItems,
	};

	try {
		const order = await createOrder(orderData);
		return order;
	} catch (error) {
		console.error("Error in createOrderService:", error);
		return {
			error: "Failed to create order. Please try again.",
		};
	}
}

export function getOrdersList() {}

export function getOrderItem() {}

export function updateOrderStatus() {}

export function cancelOrder() {}
