import {
	createOrder,
	getCustomerOrders,
	getOrderById,
	getSellerOrders,
	updateOrderStatus,
} from "@/data/order.repo";
import { getProductsByIds } from "@/data/product.repo";
import {
	orderStatusSchema,
	type PlaceOrderInput,
	placeOrderSchema,
	validOrderTransitions,
} from "@/lib/zod/order.validation";
import type { OrderStatus } from "@/types/enum";
import type {
	CreateOrderRepoData,
	OrderErrorResponse,
	OrderResponse,
} from "@/types/order";

import { generateTrackingNumber } from "@/utils/generate-tracking-number";

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
		orderDate: new Date(),
		totalAmount,
		shippingAddress: data.shippingAddress,
		paymentMethod: data.paymentMethod,
		trackingNumber,
		items: orderItems,
	};

	try {
		const order = await createOrder(userId, orderData);

		return order;
	} catch (error) {
		console.error("Error in createOrderService:", error);
		return {
			error: "Failed to create order. Please try again.",
		};
	}
}

export async function getOrdersByCustomerService(userId: string, role: string) {
	if (!userId) {
		return { error: "User ID not found" };
	}

	if (role !== "CUSTOMER") {
		return {
			error:
				"Unauthorized, only user with customer role are allowed to place order",
		};
	}

	const orders = await getCustomerOrders(userId);

	return orders;
}

export async function getOrdersBySellerService(userId: string, role: string) {
	if (!userId) {
		return { error: "User ID not found" };
	}

	if (role !== "SELLER" && role !== "ADMIN") {
		return {
			error:
				"Unauthorized, only users with seller/admin role are allowed to view seller orders",
		};
	}

	const orders = await getSellerOrders(userId);

	return orders;
}

export async function getOrderByIdService(role: string, orderId: string) {
	if (!orderId) {
		return { error: "Order ID not found" };
	}

	if (role !== "CUSTOMER") {
		return {
			error:
				"Unauthorized, only user with customer role are allowed to place order",
		};
	}

	const order = await getOrderById(orderId);

	if (!order) {
		return {
			error: "Order not found with the provided order ID",
		};
	}

	const { user, ...rest } = order;

	return {
		...rest,
		customer: user,
	};
}

export async function updateOrderStatusService(
	userId: string,
	role: string,
	orderId: string,
	status: OrderStatus,
) {
	if (!userId || !orderId || !status) {
		return { error: "Missing required fields" };
	}

	const statusValidation = orderStatusSchema.safeParse(status);
	if (!statusValidation.success) {
		return {
			error: "Invalid order status",
			details: statusValidation.error,
		};
	}

	const orderStatus = statusValidation.data;

	// Check Role authorization
	if (role !== "CUSTOMER" && role !== "SELLER" && role !== "ADMIN") {
		return { error: "Unauthorized user role" };
	}

	if (role === "CUSTOMER" && orderStatus !== "CANCELED") {
		return {
			error: "Unauthorized, customers can only cancel orders",
		};
	}

	// Get Order
	const order = await getOrderById(orderId);

	if (!order) {
		return { error: "Order not found with the provided order ID" };
	}

	// Order ownership validation by customer
	if (role === "CUSTOMER" && order.userId !== userId) {
		return { error: "Unauthorized, you can only modify your own orders" };
	}

	const currentStatus = order.status;
	if (currentStatus === orderStatus) {
		return order;
	}

	// Order Status Transition Validation
	const allowedOrderTransition = validOrderTransitions[currentStatus];
	if (!allowedOrderTransition.includes(orderStatus)) {
		return {
			error: `Cannot change order status from ${currentStatus} to ${orderStatus}`,
		};
	}

	try {
		const updatedOrder = await updateOrderStatus(orderId, orderStatus);
		return updatedOrder;
	} catch (err) {
		console.error("Error updating order status", err);
		return { error: "Failed to update order status" };
	}
}

export async function cancelOrder() {}
