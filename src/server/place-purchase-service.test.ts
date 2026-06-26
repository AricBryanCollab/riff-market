import { describe, expect, it, vi } from "vitest";
import {
	type PlacePurchaseCommand,
	type PlacePurchaseResult,
	placePurchaseError,
} from "@/domains/ordering/application/place-purchase";
import type { PlacePurchaseInput } from "@/domains/ordering/dto/place-purchase-request";
import { Money } from "@/domains/shared/domain/money";
import { err, ok } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	placePurchaseForCurrentUser,
	validatePlacePurchaseInput,
} from "@/server/place-purchase-service";
import { RequestError } from "@/server/request-error";

const customer: ServerUserContext = {
	id: "customer-1",
	email: "pat@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const validInput: PlacePurchaseInput = {
	items: [{ productId: "listing-1", quantity: 2 }],
	shippingAddress: "123 Market St",
	paymentMethod: "CASH",
};

describe("placePurchaseForCurrentUser", () => {
	it("maps the current checkout payload into a PlacePurchase command", async () => {
		const execute = vi.fn().mockResolvedValue(
			ok({
				purchaseId: "purchase-1",
				purchaseNumber: "RIFF-1001",
				total: Money.fromCents(250_00, "USD"),
				paymentStatus: "MANUALLY_CONFIRMED",
				status: "OPEN",
				sellerOrderIds: ["seller-order-1"],
			} satisfies PlacePurchaseResult),
		);

		const response = await placePurchaseForCurrentUser(
			customer,
			validInput,
			execute,
		);

		expect(execute).toHaveBeenCalledWith(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [{ listingId: "listing-1", quantity: 2 }],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			} satisfies PlacePurchaseCommand,
		);
		expect(response).toEqual({
			message: "An order has been placed",
			purchase: {
				id: "purchase-1",
				purchaseNumber: "RIFF-1001",
				totalAmountCents: 250_00,
				currencyCode: "USD",
				paymentStatus: "MANUALLY_CONFIRMED",
				status: "OPEN",
				sellerOrderIds: ["seller-order-1"],
			},
		});
	});

	it("maps expected PlacePurchase errors into request errors", async () => {
		const execute = vi
			.fn()
			.mockResolvedValue(
				err(
					placePurchaseError(
						"PLACE_PURCHASE_INSUFFICIENT_STOCK",
						"Insufficient stock for listing listing-1",
						"conflict",
					),
				),
			);

		await expect(
			placePurchaseForCurrentUser(customer, validInput, execute),
		).rejects.toMatchObject({
			name: "RequestError",
			code: "PLACE_PURCHASE_INSUFFICIENT_STOCK",
			message: "Insufficient stock for listing listing-1",
			status: 409,
		});
	});

	it("validates and trims the checkout input", () => {
		const input = validatePlacePurchaseInput({
			items: [{ productId: " listing-1 ", quantity: 1 }],
			shippingAddress: " 123 Market St ",
			paymentMethod: "VISA",
		});

		expect(input).toEqual({
			items: [{ productId: "listing-1", quantity: 1 }],
			shippingAddress: "123 Market St",
			paymentMethod: "VISA",
		});
	});

	it("rejects invalid checkout input before use-case execution", () => {
		expect(() => {
			validatePlacePurchaseInput({
				items: [],
				shippingAddress: "x",
				paymentMethod: "WIRE",
			});
		}).toThrow(RequestError);
	});
});
