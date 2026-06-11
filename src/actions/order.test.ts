import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

const { orderRepoMock, productRepoMock } = vi.hoisted(() => {
	const orderRepoMock = {
		createOrder: vi.fn(),
		getCustomerOrders: vi.fn(),
		getOrderById: vi.fn(),
		getSellerOrders: vi.fn(),
		updateOrderStatus: vi.fn(),
	} as const;

	const productRepoMock = {
		getProductsByIds: vi.fn(),
	} as const;

	return {
		orderRepoMock,
		productRepoMock,
	};
});

vi.mock("@/data/order.repo", () => orderRepoMock);
vi.mock("@/data/product-repo", () => productRepoMock);

import { getOrderByIdService, updateOrderStatusService } from "@/actions/order";

describe("order action security characterization", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("allows a customer to read their own order", async () => {
		(orderRepoMock.getOrderById as Mock).mockResolvedValue({
			id: "order-1",
			userId: "customer-1",
			status: "PENDING",
			user: {
				id: "customer-1",
				email: "customer@example.com",
				firstName: "Owning",
				lastName: "Customer",
			},
		});

		const result = await getOrderByIdService(
			"customer-1",
			"CUSTOMER",
			"order-1",
		);

		expect(result).toMatchObject({
			id: "order-1",
			userId: "customer-1",
			customer: {
				id: "customer-1",
				email: "customer@example.com",
			},
		});
	});

	it("blocks customer order reads when the order belongs to another customer", async () => {
		(orderRepoMock.getOrderById as Mock).mockResolvedValue({
			id: "order-1",
			userId: "customer-2",
			status: "PENDING",
			user: {
				id: "customer-2",
				email: "other@example.com",
				firstName: "Other",
				lastName: "Customer",
			},
		});

		const result = await getOrderByIdService(
			"customer-1",
			"CUSTOMER",
			"order-1",
		);

		expect(result).toMatchObject({
			error: "Unauthorized, you can only view your own orders",
		});
	});

	it.fails("blocks sellers from updating orders that do not contain their listings", async () => {
		(orderRepoMock.getOrderById as Mock).mockResolvedValue({
			id: "order-1",
			userId: "customer-1",
			status: "PENDING",
			items: [
				{
					product: {
						seller: {
							id: "seller-2",
						},
					},
				},
			],
		});
		(orderRepoMock.updateOrderStatus as Mock).mockResolvedValue({
			id: "order-1",
			status: "PROCESSING",
		});

		const result = await updateOrderStatusService(
			"seller-1",
			"SELLER",
			"order-1",
			"PROCESSING",
		);

		expect(result).toMatchObject({
			error: "Unauthorized, you can only update orders for your own listings",
		});
		expect(orderRepoMock.updateOrderStatus).not.toHaveBeenCalled();
	});
});
