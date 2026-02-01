import { createFileRoute } from "@tanstack/react-router";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";
import { getProductQuerySchema } from "@/lib/zod/product.validation";
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

							const parsedQuery = getProductQuerySchema.safeParse({
								limit: url.searchParams.get("limit"),
								offset: url.searchParams.get("offset"),
								random: url.searchParams.get("random"),
							});

							if (!parsedQuery.success) {
								return new Response(
									JSON.stringify({
										message: "Invalid query parameters",
										errors: parsedQuery.error.issues.map((issue) => ({
											field: issue.path.join("."),
											message: issue.message,
										})),
									}),
									{
										status: 400,
									},
								);
							}

							const { limit, offset, random } = parsedQuery.data;

							const products = await getApprovedProductsService({
								limit,
								offset,
								random,
							});

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
