import { createFileRoute } from "@tanstack/react-router";
import {
	deleteProductService,
	getProductByIdService,
	updateProductService,
} from "@/actions/product";
import { logger } from "@/lib/logger";
import type { UpdateProductInput } from "@/lib/zod/product-validation";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { extractPartialFormData } from "@/utils/extract-form-data";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async ({ params }) => {
						try {
							const { id } = params;

							const product = await getProductByIdService(id);

							return new Response(JSON.stringify(product), { status: 200 });
						} catch (error) {
							logger.error("Failed to get product by ID", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get the product by ID",
								}),
								{ status: 500 },
							);
						}
					},
				},
				PUT: {
					middleware: [authMiddleware],
					handler: async ({ request, params, context }) => {
						try {
							const { id } = params;
							const sellerId = context.id;
							const role = context.role;
							const formData = await request.formData();

							const extractedData = extractPartialFormData(formData, [
								"name",
								"category",
								"brand",
								"model",
								"description",
								"price",
								"stock",
							]);

							const images = formData.getAll("image") as File[];

							const rawData: UpdateProductInput = {
								...extractedData,

								...(extractedData.price && {
									price: Number(extractedData.price),
								}),
								...(extractedData.stock && {
									stock: Number(extractedData.stock),
								}),
								...(images.length > 0 && { images }),
							};
							const updatedProduct = await updateProductService(
								id,
								sellerId,
								role,
								rawData,
							);

							if ("error" in updatedProduct) {
								return new Response(
									JSON.stringify({
										message: updatedProduct.error,
									}),
									{ status: 400 },
								);
							}

							return new Response(
								JSON.stringify({
									message: "Product has been updated",
									product: updatedProduct,
								}),
								{
									status: 200,
								},
							);
						} catch (error) {
							logger.error("Failed to update a product", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get to update a product",
								}),
								{ status: 500 },
							);
						}
					},
				},
				DELETE: {
					middleware: [authMiddleware],
					handler: async ({ params, context }) => {
						try {
							const sellerId = context.id;
							const role = context.role;
							const { id } = params;

							const deletedProduct = await deleteProductService(
								id,
								sellerId,
								role,
							);

							if ("error" in deletedProduct) {
								return new Response(
									JSON.stringify({
										message: deletedProduct.error,
									}),
									{ status: 400 },
								);
							}

							return new Response(
								JSON.stringify({
									message: "Product deleted successfully",
									product: deletedProduct,
								}),
								{ status: 200 },
							);
						} catch (error) {
							logger.error("Failed to delete the product", error);
							return new Response(
								JSON.stringify({
									message: "Failed to delete the product",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
