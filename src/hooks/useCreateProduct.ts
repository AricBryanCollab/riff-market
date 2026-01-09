import { useState } from "react";
import type { ProductCategory } from "@/types/enum";
import type { CreateProductRequest } from "@/types/product";

const initialProduct = {
	name: "",
	category: "ELECTRIC" as ProductCategory,
	brand: "",
	model: "",
	description: "",
	price: 0,
	stock: 0,
};

type CreateProductWithoutImages = Omit<CreateProductRequest, "images">;

const useCreateProduct = () => {
	const [product, setProduct] =
		useState<CreateProductWithoutImages>(initialProduct);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setProduct({ ...product, [e.target.id]: e.target.value });
	};

	return { product, onChange };
};

export default useCreateProduct;
