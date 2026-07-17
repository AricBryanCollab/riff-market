import { z } from "zod";
import type {
	ChangeSellerOrderStatusCommand,
	ChangeSellerOrderStatusError,
	ChangeSellerOrderStatusResult,
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
import type { Result } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

const sellerOrderCommandStatuses = sellerStatusCommands;

const orderDetailInputSchema = z.object({
	orderId: z.string().trim().min(1, "Order ID is required"),
});

const changeSellerOrderStatusInputSchema = z.object({
	sellerOrderId: z.string().trim().min(1, "Seller order ID is required"),
	status: z.enum(sellerOrderCommandStatuses),
	trackingNumber: z.preprocess((value) => {
		if (typeof value !== "string") {
			return value;
		}

		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}, z.string().optional().nullable()),
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

type ChangeSellerOrderStatusRunner = (
	actor: Actor,
	command: ChangeSellerOrderStatusCommand,
) => Promise<
	Result<ChangeSellerOrderStatusResult, ChangeSellerOrderStatusError>
>;

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
	runChangeSellerOrderStatus?: ChangeSellerOrderStatusRunner,
): Promise<SellerOrderStatusChangeResponse> {
	const runner =
		runChangeSellerOrderStatus ??
		(await createPrismaChangeSellerOrderStatusRunner());
	const actor = toActor(user);
	const command = {
		sellerOrderId: input.sellerOrderId,
		status: input.status,
		trackingNumber: input.trackingNumber,
	};
	const result = await runner(actor, command);

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

async function createPrismaChangeSellerOrderStatusRunner() {
	const [
		{ prisma },
		{ changeSellerOrderStatus },
		{ PrismaSellerOrderStatusRepository },
		{ releaseListingStockForCanceledOrder },
		{ PrismaUnitOfWork },
	] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/ordering/application/change-seller-order-status"),
		import(
			"@/domains/ordering/infrastructure/prisma-seller-order-status-repository"
		),
		import("@/domains/ordering/infrastructure/prisma-listings-for-purchase"),
		import("@/domains/shared/infrastructure/prisma-unit-of-work"),
	]);

	const dependencies = {
		unitOfWork: new PrismaUnitOfWork(prisma),
		listingStock: {
			releaseForCanceledOrder: releaseListingStockForCanceledOrder,
		},
		sellerOrders: new PrismaSellerOrderStatusRepository(prisma),
	};

	return (actor: Actor, command: ChangeSellerOrderStatusCommand) =>
		changeSellerOrderStatus(actor, command, dependencies);
}
