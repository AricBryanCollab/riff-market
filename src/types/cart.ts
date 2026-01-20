import type { BaseProduct } from "@/types/product";

export interface CartItem {
	product: BaseProduct | undefined;
	isLoading: boolean;
	isError: boolean;
	productId: string;
	quantity: number;
}
