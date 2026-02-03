import type { ProductCategory, ProductCondition } from "@/types/enum";

interface MutateBaseProduct {
	name: string;
	category: ProductCategory;
	condition: ProductCondition;
	brand: string;
	model: string;
	description: string;
	price: number;
	stock: number;
}

export interface CreateProductRequest extends MutateBaseProduct {
	images: File[] | string[];
}

export interface UpdateProductForm extends MutateBaseProduct {
	images: (File | string)[];
}

export type UpdateProductRequest = Partial<
	MutateBaseProduct & {
		images: File[];
	}
>;

interface SellerDetails {
	firstName: string;
	lastName: string;
	email: string;
}

export interface BaseProduct {
	id: string;
	sellerId: string;
	name: string;
	category: ProductCategory;
	condition: ProductCondition;
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

export interface GetApprovedProcutsFilterQuery {
	limit?: number;
	offset?: number;
	category?: string;
	brand?: string;
	search?: string;
	condition?: string;
	priceMin?: number;
	priceMax?: number;
}

export interface ProductResponse {
	message: string;
	product: MutateProductResponse;
}

export interface UpdateProductStatusRequest {
	id: string;
	isApproved: boolean;
}

export interface UpdateProductStatusResult {
	id: string;
	name: string;
	isApproved: boolean;
}

export interface CategoryMeta {
	category: ProductCategory;
	label: string;
	icon: string;
	count: number;
}

export interface ProductCountByCategoryData {
	category: ProductCategory;
	count: number;
}

export type ProductCountStatusQuery = "approved" | "pending";

export interface ApprovedProductCount {
	approvedProductCount: number;
}

export interface PendingProductCount {
	pendingProductCount: number;
}
