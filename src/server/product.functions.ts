import { createServerFn } from "@tanstack/react-start";
import { getProductsBySellerService } from "@/actions/product";
import { requestLoggerMiddleware } from "@/middleware";
import { createServerRoleMiddleware } from "@/server/function-middleware";
import type { BaseProduct } from "@/types/product";

type SellerProductResult = Awaited<
	ReturnType<typeof getProductsBySellerService>
>[number];

function toClientProduct(product: SellerProductResult): BaseProduct {
	return {
		...product,
		createdAt: product.createdAt?.toISOString(),
		updatedAt: product.updatedAt?.toISOString(),
	};
}

export const getCurrentSellerProductsFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware, createServerRoleMiddleware(["SELLER"])])
	.handler(async ({ context }) => {
		const products = await getProductsBySellerService(context.user.id);

		return products.map(toClientProduct);
	});
