import { createFileRoute } from "@tanstack/react-router";
import { getProductByIdService, updateProductService } from "@/actions/product";
import type { UpdateProductInput } from "@/lib/zod/product.validation";
import { extractFormData } from "@/utils/extractFormData";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
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

							const extractedData = extractFormData(formData, [
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
								...(images.length > 0 && { images }),
							};

							const result = await updateProductService(id, rawData);

							return new Response(JSON.stringify(result), { status: 200 });
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
			}),
	},
});
