import { getProductByIdService } from "@/actions/product";

type ProductByIdResult = Awaited<ReturnType<typeof getProductByIdService>>;
type ProductByIdLoader = (productId: string) => Promise<ProductByIdResult>;

export async function getProductByIdResponse(
	productId: string,
	loadProduct: ProductByIdLoader = getProductByIdService,
): Promise<Response> {
	const product = await loadProduct(productId);

	if (isProductReadError(product)) {
		return new Response(JSON.stringify({ message: product.error }), {
			status: 404,
		});
	}

	return new Response(JSON.stringify(product), { status: 200 });
}

function isProductReadError(
	product: ProductByIdResult,
): product is Extract<ProductByIdResult, { error: string }> {
	return "error" in product;
}
