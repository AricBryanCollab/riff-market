import { createFileRoute } from "@tanstack/react-router";
import type { ProductCategory } from "generated/prisma/enums";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";

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

							const name = formData.get("name") as string;
							const category = formData.get("category") as ProductCategory;
							const brand = formData.get("brand") as string;
							const model = formData.get("model") as string;
							const description = formData.get("description") as string;
							const price = formData.get("price") as string;
							const stock = formData.get("stock") as string;

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
