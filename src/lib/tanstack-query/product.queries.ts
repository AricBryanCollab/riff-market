import { apiFetch } from "@/lib/tanstack-query/fetch";

import type {
	CreateProductInput,
	UpdateProductInput,
} from "@/lib/zod/product.validation";
import type { BaseProduct, ProductResponse } from "@/types/product";

export function createProduct(data: CreateProductInput) {
	return apiFetch<ProductResponse>("/api/products", {
		method: "POST",
		body: JSON.stringify(data),
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
	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
		contentType: "multipart/form-data",
	});
}

export function deleteProduct(id: string) {
	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "DELETE",
	});
}
