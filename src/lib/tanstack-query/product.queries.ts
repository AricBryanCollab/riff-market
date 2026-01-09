import { apiFetch } from "@/lib/tanstack-query/fetch";

import type {
	CreateProductInput,
	UpdateProductInput,
} from "@/lib/zod/product.validation";
import type { BaseProduct, ProductResponse } from "@/types/product";

function prepareProductFormData(
	data: CreateProductInput | UpdateProductInput,
): FormData {
	const formData = new FormData();

	if (data.name !== undefined) formData.append("name", data.name);
	if (data.category !== undefined) formData.append("category", data.category);
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
	return apiFetch<BaseProduct>(`/api/products/${id}`, {
		method: "GET",
	});
}

export function getApprovedProducts() {
	return apiFetch<BaseProduct[]>("/api/products", {
		method: "GET",
	});
}

export function updateProduct(id: string, data: UpdateProductInput) {
	const formData = prepareProductFormData(data);

	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "PUT",
		body: formData,
		contentType: "multipart/form-data",
	});
}

export function deleteProduct(id: string) {
	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "DELETE",
	});
}
