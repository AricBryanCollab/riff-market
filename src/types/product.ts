import type { ProductCategory } from "@/types/enum";

export interface CreateProductRequest {
	name: string;
	category: ProductCategory;
	brand: string;
	model: string;
	images: File[];
	description: string;
	price: number;
	stock: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

interface SellerDetails {
	firstName: string;
	lastName: string;
	email: string;
}

export interface BaseProduct {
	id: string;
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
	seller: SellerDetails;
}

export interface MutateProductResponse {
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

export interface ProductResponse {
	message: string;
	product: MutateProductResponse;
}

export interface ApproveProductRequest {
	isApproved: boolean;
}

export interface UpdateProductStatusResult {
	id: string;
	name: string;
	isApproved: boolean;
}
