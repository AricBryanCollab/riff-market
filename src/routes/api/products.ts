import { createFileRoute } from "@tanstack/react-router";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";
import { authMiddleware } from "@/middleware";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import { extractFormData } from "@/utils/extractFormData";

export const Route = createFileRoute("/api/products")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);

							const rawQuery = {
								limit: url.searchParams.get("limit"),
								offset: url.searchParams.get("offset"),
								random: url.searchParams.get("random"),
								category: url.searchParams.get("category"),
								condition: url.searchParams.get("condition"),
								brand: url.searchParams.get("brand"),
								search: url.searchParams.get("search"),
								priceMin: url.searchParams.get("priceMin"),
								priceMax: url.searchParams.get("priceMax"),
							};

							const products = await getApprovedProductsService(rawQuery);

							if ("error" in products) {
								return new Response(JSON.stringify(products), {
									status: 400,
								});
							}

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
					middleware: [authMiddleware],
					handler: async ({ request, context }) => {
						try {
							const sellerId = context.id;
							const authRole = context.role;
							const formData = await request.formData();

							const {
								name,
								category,
								condition,
								brand,
								model,
								description,
								price,
								stock,
							} = extractFormData<{
								name: string;
								category: ProductCategory;
								condition: ProductCondition;
								brand: string;
								model: string;
								description: string;
								price: string;
								stock: string;
							}>(formData, [
								"name",
								"category",
								"condition",
								"brand",
								"model",
								"description",
								"price",
								"stock",
							]);

							const images = formData.getAll("image") as File[];

							const rawData = {
								name,
								category,
								condition,
								brand,
								model,
								description,
								price: Number(price),
								stock: Number(stock),
								images,
							};

							const newProduct = await createProductService(
								sellerId,
								authRole,
								rawData,
							);

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
									product: newProduct,
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
