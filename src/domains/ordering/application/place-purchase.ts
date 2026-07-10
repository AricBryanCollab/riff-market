import type { ReservedListingItemSnapshot } from "@/domains/listings/domain/listing";
import {
	type PaymentStatus,
	Purchase,
	type PurchaseStatus,
} from "@/domains/ordering/domain/purchase";
import type { SellerOrderItemSnapshot } from "@/domains/ordering/domain/seller-order";
import { SellerOrder } from "@/domains/ordering/domain/seller-order";
import { isValidShippingAddress } from "@/domains/ordering/domain/shipping-address";
import type { UnitOfWork } from "@/domains/shared/application/unit-of-work";
import type { Actor } from "@/domains/shared/domain/actor";
import type { DomainEvent } from "@/domains/shared/domain/domain-event";
import { Money } from "@/domains/shared/domain/money";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type PlacePurchaseItem = {
	readonly listingId: string;
	readonly quantity: number;
};

export type PlacePurchaseCommand = {
	readonly items: PlacePurchaseItem[];
	readonly buyerName: string;
	readonly buyerEmail: string;
	readonly buyerPhone: string | null;
	readonly shippingAddress: string;
};

export type ReservedSellerListingGroup = {
	readonly sellerId: string;
	readonly items: ReservedListingItemSnapshot[];
};

export type PlacePurchaseErrorCode =
	| "PLACE_PURCHASE_UNAUTHORIZED"
	| "PLACE_PURCHASE_EMPTY_ITEMS"
	| "PLACE_PURCHASE_INVALID_ITEM_QUANTITY"
	| "PLACE_PURCHASE_INVALID_BUYER_SNAPSHOT"
	| "PLACE_PURCHASE_INVALID_SHIPPING_ADDRESS"
	| "PLACE_PURCHASE_LISTING_NOT_FOUND"
	| "PLACE_PURCHASE_LISTING_NOT_ORDERABLE"
	| "PLACE_PURCHASE_INSUFFICIENT_STOCK"
	| "PLACE_PURCHASE_CURRENCY_MISMATCH"
	| "PLACE_PURCHASE_INVARIANT_FAILED"
	| "PLACE_PURCHASE_TRANSACTION_FAILED";

export type PlacePurchaseError = AppError<PlacePurchaseErrorCode>;

export type PlacePurchaseResult = {
	readonly purchaseId: string;
	readonly purchaseNumber: string;
	readonly total: Money;
	readonly paymentStatus: PaymentStatus;
	readonly status: PurchaseStatus;
	readonly sellerOrderIds: string[];
};

export type PurchasePlacedNotificationInput = {
	readonly purchase: Purchase;
	readonly sellerOrders: SellerOrder[];
	readonly domainEvents: DomainEvent[];
};

export interface ListingsForPurchasePort<TContext> {
	reserveForPurchase(
		context: TContext,
		items: PlacePurchaseItem[],
	): Promise<Result<ReservedSellerListingGroup[], PlacePurchaseError>>;
}

export type SavePurchase<TContext> = (
	context: TContext,
	purchase: Purchase,
) => Promise<void>;

export interface SellerOrderPersistencePort<TContext> {
	saveMany(context: TContext, sellerOrders: SellerOrder[]): Promise<void>;
}

export interface PurchaseNumberGeneratorPort<TContext> {
	generate(context: TContext): Promise<string>;
}

export interface PurchaseEntityIdGeneratorPort<TContext> {
	generate(context: TContext): Promise<string>;
}

export interface PurchasePlacedNotificationCreatorPort<TContext> {
	createForPurchasePlaced(
		context: TContext,
		input: PurchasePlacedNotificationInput,
	): Promise<void>;
}

export type PlacePurchaseDependencies<TContext> = {
	readonly unitOfWork: UnitOfWork<TContext>;
	readonly listings: ListingsForPurchasePort<TContext>;
	readonly savePurchase: SavePurchase<TContext>;
	readonly sellerOrders: SellerOrderPersistencePort<TContext>;
	readonly purchaseNumbers: PurchaseNumberGeneratorPort<TContext>;
	readonly entityIds: PurchaseEntityIdGeneratorPort<TContext>;
	readonly notifications: PurchasePlacedNotificationCreatorPort<TContext>;
};

export async function placePurchase<TContext>(
	actor: Actor,
	command: PlacePurchaseCommand,
	dependencies: PlacePurchaseDependencies<TContext>,
): Promise<Result<PlacePurchaseResult, PlacePurchaseError>> {
	const {
		unitOfWork,
		listings,
		savePurchase,
		sellerOrders: sellerOrderPersistence,
		purchaseNumbers,
		entityIds,
		notifications,
	} = dependencies;

	if (actor.role !== "CUSTOMER") {
		return err(
			placePurchaseError(
				"PLACE_PURCHASE_UNAUTHORIZED",
				"Only customers can place purchases",
				"authorization",
			),
		);
	}

	const validationError = validateCommand(command);
	if (validationError) {
		return err(validationError);
	}

	try {
		return await unitOfWork.runInTransaction(async (context) => {
			const reservation = await listings.reserveForPurchase(
				context,
				command.items,
			);

			if (!reservation.ok) {
				throw new PlacePurchaseRollback(reservation.error);
			}

			const [purchaseId, purchaseNumber] = await Promise.all([
				entityIds.generate(context),
				purchaseNumbers.generate(context),
			]);
			const sellerOrderInputs = await Promise.all(
				reservation.value.map(async (group) => ({
					group,
					id: await entityIds.generate(context),
				})),
			);
			let sellerOrders: SellerOrder[];
			let purchase: Purchase;

			try {
				sellerOrders = createSellerOrders(purchaseId, sellerOrderInputs);
				const total = calculatePurchaseTotal(sellerOrders);
				purchase = Purchase.placeManualPayment({
					id: purchaseId,
					customerId: actor.id,
					purchaseNumber,
					total,
					buyerSnapshot: {
						buyerName: command.buyerName,
						buyerEmail: command.buyerEmail,
						buyerPhone: command.buyerPhone,
						shippingAddress: command.shippingAddress,
					},
					sellerOrderCount: sellerOrders.length,
				});
			} catch (error) {
				throw new PlacePurchaseRollback(toDomainError(error));
			}

			await savePurchase(context, purchase);
			await sellerOrderPersistence.saveMany(context, sellerOrders);

			const domainEvents = [
				...purchase.pullDomainEvents(),
				...sellerOrders.flatMap((sellerOrder) =>
					sellerOrder.pullDomainEvents(),
				),
			];

			await notifications.createForPurchasePlaced(context, {
				purchase,
				sellerOrders,
				domainEvents,
			});

			return ok({
				purchaseId: purchase.id,
				purchaseNumber: purchase.purchaseNumber,
				total: purchase.total,
				paymentStatus: purchase.paymentStatus,
				status: purchase.status,
				sellerOrderIds: sellerOrders.map((sellerOrder) => sellerOrder.id),
			});
		});
	} catch (error) {
		if (error instanceof PlacePurchaseRollback) {
			return err(error.placePurchaseError);
		}

		return err(
			placePurchaseError(
				"PLACE_PURCHASE_TRANSACTION_FAILED",
				"Failed to place purchase",
				"unexpected",
				error,
			),
		);
	}
}

export function placePurchaseError(
	code: PlacePurchaseErrorCode,
	message: string,
	kind: PlacePurchaseError["kind"],
	details?: unknown,
): PlacePurchaseError {
	return {
		code,
		message,
		kind,
		details,
	};
}

class PlacePurchaseRollback extends Error {
	readonly placePurchaseError: PlacePurchaseError;

	constructor(placePurchaseError: PlacePurchaseError) {
		super(placePurchaseError.message);
		this.name = "PlacePurchaseRollback";
		this.placePurchaseError = placePurchaseError;
	}
}

function validateCommand(command: PlacePurchaseCommand) {
	if (command.items.length === 0) {
		return placePurchaseError(
			"PLACE_PURCHASE_EMPTY_ITEMS",
			"Purchase requires at least one item",
			"validation",
		);
	}

	for (const item of command.items) {
		if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
			return placePurchaseError(
				"PLACE_PURCHASE_INVALID_ITEM_QUANTITY",
				"Purchase item quantity must be a positive safe integer",
				"validation",
				{ listingId: item.listingId, quantity: item.quantity },
			);
		}
	}

	const missingBuyerFields = [
		["buyerName", command.buyerName, "Buyer name"],
		["buyerEmail", command.buyerEmail, "Buyer email"],
		["shippingAddress", command.shippingAddress, "Shipping address"],
	].filter(
		([, value]) => typeof value === "string" && value.trim().length === 0,
	);

	if (missingBuyerFields.length > 0) {
		return placePurchaseError(
			"PLACE_PURCHASE_INVALID_BUYER_SNAPSHOT",
			`${missingBuyerFields.map(([, , label]) => label).join(", ")} required`,
			"validation",
			{
				missingFields: missingBuyerFields.map(([field]) => field),
			},
		);
	}

	if (!isValidShippingAddress(command.shippingAddress)) {
		return placePurchaseError(
			"PLACE_PURCHASE_INVALID_SHIPPING_ADDRESS",
			"Shipping address must be at least 5 characters",
			"validation",
		);
	}

	return undefined;
}

function createSellerOrders(
	purchaseId: string,
	inputs: Array<{
		readonly id: string;
		readonly group: ReservedSellerListingGroup;
	}>,
) {
	return inputs.map(({ group, id }) =>
		SellerOrder.createManualPaymentReady({
			id,
			purchaseId,
			sellerId: group.sellerId,
			items: group.items.map(toSellerOrderItemSnapshot),
		}),
	);
}

function toSellerOrderItemSnapshot(
	item: ReservedListingItemSnapshot,
): SellerOrderItemSnapshot {
	const subTotal = item.unitPrice.multiply(item.quantity);

	return {
		listingId: item.listingId,
		listingName: item.listingName,
		brand: item.brand,
		model: item.model,
		category: item.category,
		condition: item.condition,
		primaryImageUrl: item.primaryImageUrl,
		sellerId: item.sellerId,
		sellerDisplayName: item.sellerDisplayName,
		unitPriceCents: item.unitPrice.amountMinor,
		quantity: item.quantity,
		subTotalCents: subTotal.amountMinor,
		currencyCode: item.unitPrice.currencyCode,
	};
}

function calculatePurchaseTotal(sellerOrders: SellerOrder[]) {
	const [firstOrder] = sellerOrders;
	if (!firstOrder) {
		throw new Error("Purchase requires at least one seller order");
	}

	return sellerOrders.reduce(
		(total, sellerOrder) => total.add(sellerOrder.subtotal),
		Money.zero(firstOrder.subtotal.currencyCode),
	);
}

function toDomainError(error: unknown) {
	if (error instanceof Error && error.message.includes("currency mismatch")) {
		return placePurchaseError(
			"PLACE_PURCHASE_CURRENCY_MISMATCH",
			"Purchase items must use the same currency",
			"invariant",
			error,
		);
	}

	return placePurchaseError(
		"PLACE_PURCHASE_INVARIANT_FAILED",
		error instanceof Error ? error.message : "Purchase invariant failed",
		"invariant",
		error,
	);
}
