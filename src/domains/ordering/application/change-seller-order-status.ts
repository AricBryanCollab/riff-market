import type {
	SellerOrder,
	SellerOrderStatus,
	SellerOrderStatusChangedEvent,
} from "@/domains/ordering/domain/seller-order";
import type { Actor } from "@/domains/shared/domain/actor";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
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

export interface SellerOrderStatusRepositoryPort {
	findById(
		sellerOrderId: string,
	): Promise<SellerOrderStatusChangeRecord | null>;
	save(
		sellerOrder: SellerOrder,
		domainEvents: SellerOrderStatusChangedEvent[],
	): Promise<void>;
}

export async function changeSellerOrderStatus(
	actor: Actor,
	command: ChangeSellerOrderStatusCommand,
	sellerOrders: SellerOrderStatusRepositoryPort,
): Promise<
	Result<ChangeSellerOrderStatusResult, ChangeSellerOrderStatusError>
> {
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

	const transitionError = applyTransition(record.sellerOrder, command);
	if (transitionError) {
		return err(transitionError);
	}

	try {
		await sellerOrders.save(
			record.sellerOrder,
			statusChangedEvents(record.sellerOrder.pullDomainEvents()),
		);
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
			case "NEW":
			case "ON_HOLD_PAYMENT":
				return changeSellerOrderStatusError(
					"CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
					`Cannot command seller order status ${command.status}`,
					"validation",
				);
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

function statusChangedEvents(events: DomainEvent[]) {
	return events.filter(
		(event): event is SellerOrderStatusChangedEvent =>
			event.eventName === "SellerOrderStatusChanged",
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
