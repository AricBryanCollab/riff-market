import { afterEach, describe, expect, it, vi } from "vitest";

type ProductServiceMocks = {
	deleteProductServiceMock: ReturnType<typeof vi.fn>;
	getProductByIdServiceMock: ReturnType<typeof vi.fn>;
	updateProductServiceMock: ReturnType<typeof vi.fn>;
};

function getProductServiceMocks() {
	const globalScope = globalThis as {
		__productServiceMocks?: ProductServiceMocks;
	};

	if (!globalScope.__productServiceMocks) {
		globalScope.__productServiceMocks = {
			deleteProductServiceMock: vi.fn(),
			getProductByIdServiceMock: vi.fn(),
			updateProductServiceMock: vi.fn(),
		};
	}

	return globalScope.__productServiceMocks;
}

const { deleteProductServiceMock, updateProductServiceMock } =
	getProductServiceMocks();

vi.mock("@/middleware", () => ({
	requestLoggerMiddleware: {},
	authMiddleware: {},
}));

vi.mock("@/actions/product", () => {
	const mocks = getProductServiceMocks();

	return {
		deleteProductService: mocks.deleteProductServiceMock,
		getProductByIdService: mocks.getProductByIdServiceMock,
		updateProductService: mocks.updateProductServiceMock,
	};
});

import { Route } from "@/routes/api/products.$id";

type RouteHandlers = {
	PUT: {
		handler: (args: {
			request: Request;
			params: { id: string };
			context: { id: string; role: string };
		}) => Promise<Response>;
	};
	DELETE: {
		handler: (args: {
			params: { id: string };
			context: { id: string; role: string };
		}) => Promise<Response>;
	};
};

const handlers = (
	Route.options.server as {
		handlers: (options: {
			createHandlers: (routeHandlers: RouteHandlers) => RouteHandlers;
		}) => RouteHandlers;
	}
).handlers({
	createHandlers: (routeHandlers: RouteHandlers) => routeHandlers,
});

describe("/api/products/$id handlers", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("PUT returns 400 for unauthorized modifier attempts", async () => {
		updateProductServiceMock.mockResolvedValue({
			error: "Unauthorized, user cannot modify this product",
		});

		const formData = new URLSearchParams({ name: "Blocked update" });
		const request = new Request("http://localhost/api/products/prod-1", {
			method: "PUT",
			body: formData,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		const response = await handlers.PUT.handler({
			request,
			params: { id: "prod-1" },
			context: { id: "customer-1", role: "CUSTOMER" },
		});
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({
			message: "Unauthorized, user cannot modify this product",
		});
		expect(updateProductServiceMock).toHaveBeenCalledWith(
			"prod-1",
			"customer-1",
			"CUSTOMER",
			expect.objectContaining({ name: "Blocked update" }),
		);
	});

	it("DELETE returns 400 for non-owner seller attempts", async () => {
		deleteProductServiceMock.mockResolvedValue({
			error: "Unauthorized, user cannot modify this product",
		});

		const response = await handlers.DELETE.handler({
			params: { id: "prod-1" },
			context: { id: "seller-2", role: "SELLER" },
		});
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({
			message: "Unauthorized, user cannot modify this product",
		});
		expect(deleteProductServiceMock).toHaveBeenCalledWith(
			"prod-1",
			"seller-2",
			"SELLER",
		);
	});
});
