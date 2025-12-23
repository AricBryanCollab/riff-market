import type { ProductCategory } from "@/types/enum";

export interface CreateProductRequest {
	name: string;
	category: ProductCategory;
	brand: string;
	model: string;
	image: string[];
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
	image: string[];
	description: string;
	price: number;
	stock: number;
	isApproved: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ProductResponse {
	message: string;
	product: BaseProduct;
}

export interface ApproveProductRequest {
	isApproved: boolean;
}
