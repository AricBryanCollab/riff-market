import { z } from "zod";
import {
	changeSellerOrderStatus,
	type SellerOrderStatusRepositoryPort,
} from "@/domains/ordering/application/change-seller-order-status";
import {
	getOrderDetail,
	listOrdersForActor,
	type OrderDetailQueryPort,
	type OrderListQueryPort,
} from "@/domains/ordering/application/order-queries";
import type { SellerOrderStatus } from "@/domains/ordering/domain/seller-order";
import { sellerStatusCommands } from "@/domains/ordering/domain/seller-order";
import type { OrderView } from "@/domains/ordering/dto/order-view";
import type { Actor } from "@/domains/shared/domain/actor";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

const sellerOrderCommandStatuses = sellerStatusCommands;

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
	readonly status: SellerOrderStatus;
	readonly trackingNumber: string | null;
};

type PrismaOrderQueryPort = OrderListQueryPort & OrderDetailQueryPort;

export function validateOrderDetailInput(data: unknown): OrderDetailInput {
	const parsed = orderDetailInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid order detail request", {
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
		throw new RequestError("Invalid seller order status request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function listOrdersForCurrentUser(
	user: ServerUserContext,
	queries?: OrderListQueryPort,
): Promise<OrderView[]> {
	const orderQueries = queries ?? (await createPrismaOrderQueries());
	const result = await listOrdersForActor(toActor(user), orderQueries);

	return unwrapResultOrThrowRequestError(result);
}

export async function getOrderDetailForCurrentUser(
	user: ServerUserContext,
	input: OrderDetailInput,
	queries?: OrderDetailQueryPort,
): Promise<OrderView> {
	const orderQueries = queries ?? (await createPrismaOrderQueries());
	const actor = toActor(user);
	const result = await getOrderDetail(actor, input.orderId, orderQueries);

	return unwrapResultOrThrowRequestError(result);
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
	const result = await changeSellerOrderStatus(actor, command, sellerOrders);

	return unwrapResultOrThrowRequestError(result);
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}

async function createPrismaOrderQueries(): Promise<PrismaOrderQueryPort> {
	const [{ prisma }, { PrismaOrderQueries }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/ordering/infrastructure/prisma-order-queries"),
	]);

	return new PrismaOrderQueries(prisma);
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
