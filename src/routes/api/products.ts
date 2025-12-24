import { createFileRoute } from "@tanstack/react-router";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";
import type { ProductCategory } from "@/types/enum";

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

							const rawData = {
								name: formData.get("name") as string,
								category: formData.get("category") as ProductCategory,
								brand: formData.get("brand") as string,
								model: formData.get("model") as string,
								description: formData.get("description") as string,
								price: formData.get("price") as string,
								stock: formData.get("stock") as string,
								images: formData.getAll("images") as File[],
							};

							const newProduct = await createProductService(rawData);
							if ("error" in newProduct) {
								return new Response(
									JSON.stringify({
										message: newProduct.error,
										errors: newProduct.details,
									}),
									{ status: 400 },
								);
							}

							return new Response(JSON.stringify(newProduct), { status: 201 });
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
