import { createFileRoute } from "@tanstack/react-router";
import type { ProductCategory } from "generated/prisma/enums";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";
import { extractFormData } from "@/utils/extractFormData";

export const Route = createFileRoute("/api/products")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async () => {
						try {
							const products = await getApprovedProductsService();

							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to get all approved products",
								}),
								{ status: 500 },
							);
						}
					},
				},
				POST: {
					handler: async ({ request }) => {
						try {
							const formData = await request.formData();

							const {
								name,
								category,
								brand,
								model,
								description,
								price,
								stock,
							} = extractFormData<{
								name: string;
								category: ProductCategory;
								brand: string;
								model: string;
								description: string;
								price: string;
								stock: string;
							}>(formData, [
								"name",
								"category",
								"brand",
								"model",
								"description",
								"price",
								"stock",
							]);

							const images = formData.getAll("image") as File[];

							const newProduct = await createProductService({
								name,
								category,
								brand,
								model,
								description,
								price: Number(price),
								stock: Number(stock),
								images,
							});

							if ("error" in newProduct) {
								return new Response(
									JSON.stringify({
										message: newProduct.error,
										details: newProduct.details,
									}),
									{ status: 400 },
								);
							}

							return new Response(
								JSON.stringify({
									newProduct,
									message: "New product has been added",
								}),
								{ status: 201 },
							);
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message:
										error instanceof Error
											? error.message
											: "Failed to create the product",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
