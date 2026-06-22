import { z } from "zod";
import type {
	ChangeSellerOrderStatusError,
	SellerOrderStatusRepositoryPort,
} from "@/domains/ordering/application/change-seller-order-status";
import { ChangeSellerOrderStatus } from "@/domains/ordering/application/change-seller-order-status";
import {
	type BuyerPurchaseHistoryPort,
	GetOrderDetail,
	ListBuyerPurchaseHistory,
	ListSellerOrderDashboard,
	type OrderDetailReadPort,
	type OrderReadError,
	type SellerOrderDashboardPort,
} from "@/domains/ordering/application/order-read-models";
import type { SellerOrderStatus } from "@/domains/ordering/domain/seller-order";
import type {
	OrderingOrderReadModel,
	OrderingOrderReadStatus,
} from "@/domains/ordering/dto/order-read-model";
import type { Actor } from "@/domains/shared/domain/actor";
import type { ServerUserContext } from "@/server/function-middleware";

const sellerOrderCommandStatuses = [
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"CANCELED",
] as const satisfies readonly SellerOrderStatus[];

const orderDetailInputSchema = z.object({
	orderId: z.string().trim().min(1, "Order ID is required"),
});

const changeSellerOrderStatusInputSchema = z
	.object({
		sellerOrderId: z.string().trim().min(1, "Seller order ID is required"),
		status: z.enum(sellerOrderCommandStatuses),
		trackingNumber: z.preprocess((value) => {
			if (typeof value !== "string") {
				return value;
			}

			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : undefined;
		}, z.string().optional().nullable()),
	})
	.superRefine((input, context) => {
		if (input.status === "SHIPPED" && !input.trackingNumber) {
			context.addIssue({
				code: "custom",
				path: ["trackingNumber"],
				message: "Tracking number is required to ship seller order",
			});
		}
	});

export type OrderDetailInput = z.infer<typeof orderDetailInputSchema>;
export type ChangeSellerOrderStatusInput = z.infer<
	typeof changeSellerOrderStatusInputSchema
>;

export type SellerOrderStatusChangeResponse = {
	readonly sellerOrderId: string;
	readonly purchaseId: string;
	readonly status: OrderingOrderReadStatus;
	readonly trackingNumber: string | null;
};

export class OrderRequestError extends Error {
	readonly code?: string;
	readonly details?: unknown;
	readonly status: number;

	constructor(
		message: string,
		options: { code?: string; details?: unknown; status?: number } = {},
	) {
		super(message);
		this.name = "OrderRequestError";
		this.code = options.code;
		this.details = options.details;
		this.status = options.status ?? 400;
	}
}

type OrderReadModels = BuyerPurchaseHistoryPort &
	SellerOrderDashboardPort &
	OrderDetailReadPort;

export function validateOrderDetailInput(data: unknown): OrderDetailInput {
	const parsed = orderDetailInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new OrderRequestError("Invalid order detail request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateChangeSellerOrderStatusInput(
	data: unknown,
): ChangeSellerOrderStatusInput {
	const parsed = changeSellerOrderStatusInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new OrderRequestError("Invalid seller order status request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function listOrdersForCurrentUser(
	user: ServerUserContext,
	readModels?: OrderReadModels,
): Promise<OrderingOrderReadModel[]> {
	const actor = toActor(user);
	const orderReadModels = readModels ?? (await createPrismaOrderReadModels());

	if (actor.role === "CUSTOMER") {
		const listBuyerPurchaseHistory = new ListBuyerPurchaseHistory(
			orderReadModels,
		);
		const result = await listBuyerPurchaseHistory.execute(actor);

		if (!result.ok) {
			throw toOrderRequestError(result.error);
		}

		return result.value;
	}

	if (actor.role === "SELLER" || actor.role === "ADMIN") {
		const listSellerOrderDashboard = new ListSellerOrderDashboard(
			orderReadModels,
		);
		const result = await listSellerOrderDashboard.execute(actor);

		if (!result.ok) {
			throw toOrderRequestError(result.error);
		}

		return result.value;
	}

	throw new OrderRequestError(
		"Only customers, sellers, and admins can read orders",
		{
			status: 403,
		},
	);
}

export async function getOrderDetailForCurrentUser(
	user: ServerUserContext,
	input: OrderDetailInput,
	readModels?: OrderReadModels,
): Promise<OrderingOrderReadModel> {
	const orderReadModels = readModels ?? (await createPrismaOrderReadModels());
	const actor = toActor(user);
	const getOrderDetail = new GetOrderDetail(orderReadModels);
	const result = await getOrderDetail.execute(actor, input.orderId);

	if (!result.ok) {
		throw toOrderRequestError(result.error);
	}

	return result.value;
}

export async function changeSellerOrderStatusForCurrentUser(
	user: ServerUserContext,
	input: ChangeSellerOrderStatusInput,
	repository?: SellerOrderStatusRepositoryPort,
): Promise<SellerOrderStatusChangeResponse> {
	const sellerOrders =
		repository ?? (await createPrismaSellerOrderStatusRepository());
	const actor = toActor(user);
	const command = {
		sellerOrderId: input.sellerOrderId,
		status: input.status,
		trackingNumber: input.trackingNumber,
	};
	const changeSellerOrderStatus = new ChangeSellerOrderStatus(sellerOrders);
	const result = await changeSellerOrderStatus.execute(actor, command);

	if (!result.ok) {
		throw toOrderRequestError(result.error);
	}

	return result.value;
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}

async function createPrismaOrderReadModels(): Promise<OrderReadModels> {
	const [{ prisma }, { PrismaOrderReadModels }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/ordering/infrastructure/prisma-order-read-models"),
	]);

	return new PrismaOrderReadModels(prisma);
}

async function createPrismaSellerOrderStatusRepository(): Promise<SellerOrderStatusRepositoryPort> {
	const [{ prisma }, { PrismaSellerOrderStatusRepository }] = await Promise.all(
		[
			import("@/data/connect-db"),
			import(
				"@/domains/ordering/infrastructure/prisma-seller-order-status-repository"
			),
		],
	);

	return new PrismaSellerOrderStatusRepository(prisma);
}

function toOrderRequestError(
	error: OrderReadError | ChangeSellerOrderStatusError,
) {
	return new OrderRequestError(error.message, {
		code: error.code,
		details: error.details,
		status: toStatus(error),
	});
}

function toStatus(error: OrderReadError | ChangeSellerOrderStatusError) {
	switch (error.kind) {
		case "authorization":
			return 403;
		case "not-found":
			return 404;
		case "conflict":
			return 409;
		case "validation":
			return 400;
		case "invariant":
		case "unexpected":
			return 500;
	}
}
