import { createFileRoute } from "@tanstack/react-router";
import {
	deleteProductService,
	getProductByIdService,
	updateProductService,
} from "@/actions/product";
import type { UpdateProductInput } from "@/lib/zod/product.validation";
import { authMiddleware } from "@/middleware";
import { extractPartialFormData } from "@/utils/extractFormData";

export const Route = createFileRoute("/api/products/$id")({
	server: {
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
							console.error(error);
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
					handler: async ({ request, params }) => {
						try {
							const { id } = params;
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
							const updatedProduct = await updateProductService(id, rawData);

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
							console.error(error);
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
					handler: async ({ params }) => {
						try {
							const { id } = params;

							const deletedProduct = await deleteProductService(id);

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
							console.error(error);
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
