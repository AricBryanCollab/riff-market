import { apiFetch } from "@/lib/tanstack-query/fetch";

import type {
	CreateProductInput,
	UpdateProductInput,
} from "@/lib/zod/product.validation";
import type {
	BaseProduct,
	ProductCountByCategoryData,
	ProductCountByStatus,
	ProductCountStatusQuery,
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

// Create Product
export function createProduct(data: CreateProductInput) {
	const formData = prepareProductFormData(data);

	return apiFetch<ProductResponse>("/api/products", {
		method: "POST",
		body: formData,
		contentType: "multipart/form-data",
	});
}

// Get Product Details By ID
export function getProductDetailsById(id: string) {
	return apiFetch<BaseProduct>(`/api/products/${id}`);
}

//  Get Approved Product List with Query
export function getApprovedProducts(limit?: number, offset?: number) {
	const params = new URLSearchParams();

	if (limit !== undefined) params.append("limit", limit.toString());
	if (offset !== undefined) params.append("offset", offset.toString());

	const queryString = params.toString();
	const url = queryString ? `/api/products?${queryString}` : "/api/products";

	return apiFetch<BaseProduct[]>(url);
}

//  Get Approved Product List without Query
export function getAllApprovedProducts() {
	return apiFetch<BaseProduct[]>("/api/products");
}

// Get Featured Products (fixed random)
export function getFeaturedProducts() {
	return apiFetch<BaseProduct[]>("/api/products?limit=5&random=true");
}

// Get Pending for Approval Products
export function getPendingApprovalProducts() {
	return apiFetch<BaseProduct[]>("/api/products/pending");
}

// Get Product Count By Category
export function getProductCountByCategory() {
	return apiFetch<ProductCountByCategoryData[]>("/api/products/count");
}

// Get Product Count By Status
export function getProductCountByStatus(status: ProductCountStatusQuery) {
	return apiFetch<ProductCountByStatus>(`/api/products/count?status=${status}`);
}

// Get Recently Added Products (fixed to limit of 8)
export function getRecentProducts() {
	return apiFetch<BaseProduct[]>("/api/products/recent");
}

// Update Product
export function updateProduct(id: string, data: UpdateProductInput) {
	const formData = prepareProductFormData(data);

	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "PUT",
		body: formData,
		contentType: "multipart/form-data",
	});
}

//  Update Product Status
export function updateProductStatus(id: string, isApproved: boolean) {
	return apiFetch<UpdateProductStatusResult>(`/api/products/pending/${id}`, {
		method: "PUT",
		body: JSON.stringify({ isApproved }),
	});
}

// Delete Product
export function deleteProduct(id: string) {
	return apiFetch<ProductResponse>(`/api/products/${id}`, {
		method: "DELETE",
	});
}
