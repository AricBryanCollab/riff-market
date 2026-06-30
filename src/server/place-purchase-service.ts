import { z } from "zod";
import type {
	PlacePurchaseCommand,
	PlacePurchaseError,
	PlacePurchaseResult,
} from "@/domains/ordering/application/place-purchase";
import {
	type PlacePurchaseInput,
	placePurchaseInputSchema,
} from "@/domains/ordering/dto/place-purchase-request";
import type { Actor } from "@/domains/shared/domain/actor";
import type { Result } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

type PlacePurchaseRunner = (
	actor: Actor,
	command: PlacePurchaseCommand,
) => Promise<Result<PlacePurchaseResult, PlacePurchaseError>>;

export type PlacePurchaseResponse = {
	readonly message: string;
	readonly purchase: {
		readonly id: string;
		readonly purchaseNumber: string;
		readonly totalAmountCents: number;
		readonly currencyCode: string;
		readonly paymentStatus: string;
		readonly status: string;
		readonly sellerOrderIds: string[];
	};
};

export function validatePlacePurchaseInput(data: unknown): PlacePurchaseInput {
	const parsed = placePurchaseInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid order data", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function placePurchaseForCurrentUser(
	user: ServerUserContext,
	input: PlacePurchaseInput,
	runPlacePurchase?: PlacePurchaseRunner,
): Promise<PlacePurchaseResponse> {
	const placePurchaseRunner =
		runPlacePurchase ?? (await createPrismaPlacePurchaseRunner());
	const actor = toActor(user);
	const command = toCommand(user, input);
	const result = await placePurchaseRunner(actor, command);
	const purchase = unwrapResultOrThrowRequestError(result);

	return toResponse(purchase);
}

async function createPrismaPlacePurchaseRunner() {
	const [{ prisma }, { createPrismaPlacePurchase }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/ordering/infrastructure/prisma-place-purchase"),
	]);

	return createPrismaPlacePurchase({ db: prisma });
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}

function toCommand(
	user: ServerUserContext,
	input: PlacePurchaseInput,
): PlacePurchaseCommand {
	return {
		items: input.items.map((item) => ({
			listingId: item.productId,
			quantity: item.quantity,
		})),
		buyerName: getBuyerName(user),
		buyerEmail: user.email,
		buyerPhone: null,
		shippingAddress: input.shippingAddress,
	};
}

function getBuyerName(user: ServerUserContext) {
	return [user.firstName, user.lastName].join(" ").trim() || user.email;
}

function toResponse(result: PlacePurchaseResult): PlacePurchaseResponse {
	return {
		message: "An order has been placed",
		purchase: {
			id: result.purchaseId,
			purchaseNumber: result.purchaseNumber,
			totalAmountCents: result.total.amountMinor,
			currencyCode: result.total.currencyCode,
			paymentStatus: result.paymentStatus,
			status: result.status,
			sellerOrderIds: result.sellerOrderIds,
		},
	};
}
