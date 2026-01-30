import { apiFetch } from "@/lib/tanstack-query/fetch";

import type {
	CreateProductInput,
	UpdateProductInput,
} from "@/lib/zod/product.validation";
import type {
	BaseProduct,
	ProductCountByCategoryData,
	ProductResponse,
	UpdateProductStatusResult,
} from "@/types/product";

function prepareProductFormData(
	data: CreateProductInput | UpdateProductInput,
): FormData {
	const formData = new FormData();

	if (data.name !== undefined) formData.append("name", data.name);
	if (data.category !== undefined) formData.append("category", data.category);
	if (data.condition !== undefined)
		formData.append("condition", data.condition);
	if (data.brand !== undefined) formData.append("brand", data.brand);
	if (data.model !== undefined) formData.append("model", data.model);
	if (data.description !== undefined)
		formData.append("description", data.description);
	if (data.price !== undefined) formData.append("price", String(data.price));
	if (data.stock !== undefined) formData.append("stock", String(data.stock));

	if (data.images && data.images.length > 0) {
		data.images.forEach((file) => {
			formData.append("image", file);
		});
	}

	return formData;
}

export function createProduct(data: CreateProductInput) {
	const formData = prepareProductFormData(data);

	return apiFetch<ProductResponse>("/api/products", {
		method: "POST",
		body: formData,
		contentType: "multipart/form-data",
	});
}

export function getProductDetailsById(id: string) {
	return apiFetch<BaseProduct>(`/api/products/${id}`);
}

export function getApprovedProducts() {
	return apiFetch<BaseProduct[]>("/api/products");
}

export function getFeaturedProducts() {
	return apiFetch<BaseProduct[]>("/api/products?limit=5&random=true");
}

export function getShopProducts(limit: number = 50, offset: number = 0) {
	return apiFetch<BaseProduct[]>(
		`/api/products?limit=${limit}&offset=${offset}`,
	);
}

export function getPendingApprovalProducts() {
	return apiFetch<BaseProduct[]>("/api/products/pending");
}

export function getProductCountByCategory() {
	return apiFetch<ProductCountByCategoryData>("/api/products/count");
}

export function getRecentProducts() {
	return apiFetch<BaseProduct[]>("/api/products/recent");
}

export function updateProduct(id: string, data: UpdateProductInput) {
	const formData = prepareProductFormData(data);

	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "PUT",
		body: formData,
		contentType: "multipart/form-data",
	});
}

export function updateProductStatus(id: string, isApproved: boolean) {
	return apiFetch<UpdateProductStatusResult>(`/api/products/pending/${id}`, {
		method: "PUT",
		body: JSON.stringify({ isApproved }),
	});
}

export function deleteProduct(id: string) {
	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "DELETE",
	});
}
