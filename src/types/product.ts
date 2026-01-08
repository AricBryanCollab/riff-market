import type { ProductCategory } from "@/types/enum";

export interface CreateProductRequest {
	name: string;
	category: ProductCategory;
	brand: string;
	model: string;
	images: string[];
	description: string;
	price: number;
	stock: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface BaseProduct {
	id: string;
	sellerId: string;
	name: string;
	category: ProductCategory;
	brand: string;
	model: string;
	images: string[];
	description: string;
	price: number;
	stock: number;
	isApproved: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateProductResponse {
	message: string;
	newProduct: BaseProduct;
}

export interface ApproveProductRequest {
	isApproved: boolean;
}
