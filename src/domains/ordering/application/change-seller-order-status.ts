import {
	allowedSellerStatusCommands,
	type SellerOrder,
	type SellerOrderStatus,
	type SellerStatusCommand,
} from "@/domains/ordering/domain/seller-order";
import type { UnitOfWork } from "@/domains/shared/application/unit-of-work";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type ChangeSellerOrderStatusCommand = {
	readonly sellerOrderId: string;
	readonly status: SellerOrderStatus;
	readonly trackingNumber?: string | null;
};

export type SellerOrderStatusChangeRecord = {
	readonly sellerOrder: SellerOrder;
	readonly customerId: string;
};

export type ChangeSellerOrderStatusResult = {
	readonly sellerOrderId: string;
	readonly purchaseId: string;
	readonly status: SellerOrderStatus;
	readonly trackingNumber: string | null;
};

export type ChangeSellerOrderStatusErrorCode =
	| "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED"
	| "CHANGE_SELLER_ORDER_STATUS_NOT_FOUND"
	| "CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND"
	| "CHANGE_SELLER_ORDER_STATUS_INVALID_TRANSITION"
	| "CHANGE_SELLER_ORDER_STATUS_SAVE_FAILED";

export type ChangeSellerOrderStatusError =
	AppError<ChangeSellerOrderStatusErrorCode>;

export type ListingStockReleaseItem = {
	readonly listingId: string;
	readonly quantity: number;
};

export interface ListingStockReleasePort<TContext> {
	releaseForCanceledOrder(
		context: TContext,
		items: readonly ListingStockReleaseItem[],
	): Promise<void>;
}

export interface SellerOrderStatusRepositoryPort<TContext> {
	findById(
		sellerOrderId: string,
	): Promise<SellerOrderStatusChangeRecord | null>;
	save(
		context: TContext,
		sellerOrder: SellerOrder,
		expectedCurrentStatus: SellerOrderStatus,
	): Promise<boolean>;
}

export type ChangeSellerOrderStatusDependencies<TContext> = {
	readonly sellerOrders: SellerOrderStatusRepositoryPort<TContext>;
	readonly listingStock: ListingStockReleasePort<TContext>;
	readonly unitOfWork: UnitOfWork<TContext>;
};

export async function changeSellerOrderStatus<TContext>(
	actor: Actor,
	command: ChangeSellerOrderStatusCommand,
	dependencies: ChangeSellerOrderStatusDependencies<TContext>,
): Promise<
	Result<ChangeSellerOrderStatusResult, ChangeSellerOrderStatusError>
> {
	const { sellerOrders, listingStock, unitOfWork } = dependencies;
	const commandError = validateCommand(command);
	if (commandError) {
		return err(commandError);
	}

	const record = await sellerOrders.findById(command.sellerOrderId);
	if (!record) {
		return err(
			changeSellerOrderStatusError(
				"CHANGE_SELLER_ORDER_STATUS_NOT_FOUND",
				"Seller order not found",
				"not-found",
			),
		);
	}

	const authorizationError = authorize(actor, record, command.status);
	if (authorizationError) {
		return err(authorizationError);
	}

	if (record.sellerOrder.status === command.status) {
		return ok(toResult(record.sellerOrder));
	}

	const expectedCurrentStatus = record.sellerOrder.status;
	const transitionError = applyTransition(record.sellerOrder, command);
	if (transitionError) {
		return err(transitionError);
	}

	try {
		const saved = await unitOfWork.runInTransaction(async (context) => {
			const updated = await sellerOrders.save(
				context,
				record.sellerOrder,
				expectedCurrentStatus,
			);
			if (!updated) {
				return false;
			}

			if (record.sellerOrder.status === "CANCELED") {
				await listingStock.releaseForCanceledOrder(
					context,
					toStockReleaseItems(record.sellerOrder),
				);
			}

			return true;
		});

		if (!saved) {
			return err(
				changeSellerOrderStatusError(
					"CHANGE_SELLER_ORDER_STATUS_INVALID_TRANSITION",
					"Seller order status changed by another request",
					"conflict",
				),
			);
		}
	} catch (error) {
		return err(
			changeSellerOrderStatusError(
				"CHANGE_SELLER_ORDER_STATUS_SAVE_FAILED",
				"Failed to update seller order status",
				"unexpected",
				error,
			),
		);
	}

	return ok(toResult(record.sellerOrder));
}

function toStockReleaseItems(
	sellerOrder: SellerOrder,
): ListingStockReleaseItem[] {
	return sellerOrder.items.map((item) => ({
		listingId: item.listingId,
		quantity: item.quantity,
	}));
}

export function changeSellerOrderStatusError(
	code: ChangeSellerOrderStatusErrorCode,
	message: string,
	kind: ChangeSellerOrderStatusError["kind"],
	details?: unknown,
): ChangeSellerOrderStatusError {
	return {
		code,
		message,
		kind,
		details,
	};
}

function validateCommand(command: ChangeSellerOrderStatusCommand) {
	if (command.sellerOrderId.trim().length === 0) {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
			"Seller order ID is required",
			"validation",
		);
	}

	if (command.status === "NEW" || command.status === "ON_HOLD_PAYMENT") {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
			`Cannot command seller order status ${command.status}`,
			"validation",
		);
	}

	if (
		command.status === "SHIPPED" &&
		(!command.trackingNumber || command.trackingNumber.trim().length === 0)
	) {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
			"Tracking number is required to ship seller order",
			"validation",
		);
	}

	return undefined;
}

function authorize(
	actor: Actor,
	record: SellerOrderStatusChangeRecord,
	targetStatus: SellerOrderStatus,
) {
	if (actor.role === "ADMIN") {
		return undefined;
	}

	if (actor.role === "SELLER") {
		if (record.sellerOrder.sellerId !== actor.id) {
			return changeSellerOrderStatusError(
				"CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
				"Unauthorized, you can only update your own seller orders",
				"authorization",
			);
		}

		return undefined;
	}

	if (targetStatus !== "CANCELED") {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
			"Unauthorized, customers can only cancel seller orders",
			"authorization",
		);
	}

	if (record.customerId !== actor.id) {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
			"Unauthorized, you can only cancel seller orders for your own purchases",
			"authorization",
		);
	}

	return undefined;
}

function applyTransition(
	sellerOrder: SellerOrder,
	command: ChangeSellerOrderStatusCommand,
) {
	if (
		!isSellerStatusCommand(command.status) ||
		!allowedSellerStatusCommands(sellerOrder.status).includes(command.status)
	) {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
			`Cannot command seller order status ${command.status}`,
			"validation",
		);
	}

	try {
		switch (command.status) {
			case "PROCESSING":
				sellerOrder.process();
				return undefined;
			case "SHIPPED":
				sellerOrder.ship(command.trackingNumber ?? "");
				return undefined;
			case "DELIVERED":
				sellerOrder.deliver();
				return undefined;
			case "CANCELED":
				sellerOrder.cancel({ id: "system", role: "ADMIN" });
				return undefined;
		}
	} catch (error) {
		return changeSellerOrderStatusError(
			"CHANGE_SELLER_ORDER_STATUS_INVALID_TRANSITION",
			error instanceof Error
				? error.message
				: "Invalid seller order transition",
			"conflict",
			error,
		);
	}
}

function isSellerStatusCommand(
	status: SellerOrderStatus,
): status is SellerStatusCommand {
	return (
		status === "PROCESSING" ||
		status === "SHIPPED" ||
		status === "DELIVERED" ||
		status === "CANCELED"
	);
}

function toResult(sellerOrder: SellerOrder): ChangeSellerOrderStatusResult {
	return {
		sellerOrderId: sellerOrder.id,
		purchaseId: sellerOrder.purchaseId,
		status: sellerOrder.status,
		trackingNumber: sellerOrder.trackingNumber,
	};
}
