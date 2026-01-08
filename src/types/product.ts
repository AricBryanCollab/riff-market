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

export interface CreateProductResponse {
	message: string;
	newProduct: BaseProduct;
}

export interface ApproveProductRequest {
	isApproved: boolean;
}
