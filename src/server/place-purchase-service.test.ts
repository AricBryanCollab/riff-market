import { describe, expect, it } from "vitest";
import {
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

type PlacePurchaseRunner = NonNullable<
	Parameters<typeof placePurchaseForCurrentUser>[2]
>;

const customer: ServerUserContext = {
	id: "customer-1",
	email: "pat@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const validInput: PlacePurchaseInput = {
	items: [{ listingId: "listing-1", quantity: 2 }],
	shippingAddress: "123 Market St",
};

describe("placePurchaseForCurrentUser", () => {
	it("maps place-purchase results into responses", async () => {
		const execute: PlacePurchaseRunner = async () =>
			ok({
				purchaseId: "purchase-1",
				purchaseNumber: "RIFF-1001",
				total: Money.fromMinor(250_00, "USD"),
				paymentStatus: "MANUALLY_CONFIRMED",
				status: "OPEN",
				sellerOrderIds: ["seller-order-1"],
			} satisfies PlacePurchaseResult);

		const response = await placePurchaseForCurrentUser(
			customer,
			validInput,
			execute,
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
		const execute: PlacePurchaseRunner = async () =>
			err(
				placePurchaseError(
					"PLACE_PURCHASE_INSUFFICIENT_STOCK",
					"Insufficient stock for listing listing-1",
					"conflict",
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
			items: [{ listingId: " listing-1 ", quantity: 1 }],
			shippingAddress: " 123 Market St ",
		});

		expect(input).toEqual({
			items: [{ listingId: "listing-1", quantity: 1 }],
			shippingAddress: "123 Market St",
		});
	});

	it("rejects checkout items without listing IDs", () => {
		expect(() =>
			validatePlacePurchaseInput({
				items: [{ productId: "listing-1", quantity: 1 }],
				shippingAddress: "123 Market St",
			}),
		).toThrow("Invalid order data");
	});

	it("rejects invalid checkout input before use-case execution", () => {
		expect(() => {
			validatePlacePurchaseInput({
				items: [],
				shippingAddress: "x",
			});
		}).toThrow(RequestError);
	});
});
