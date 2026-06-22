import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";
import { getApprovedListingsForProductApi } from "@/server/listing-read-service";

export const Route = createFileRoute("/api/products")({
	server: {
		middleware: [requestLoggerMiddleware],
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

							const products = await getApprovedListingsForProductApi(rawQuery);

							if ("error" in products) {
								return new Response(JSON.stringify(products), {
									status: 400,
								});
							}

							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							logger.error("Failed to get all approved products", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get all approved products",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
