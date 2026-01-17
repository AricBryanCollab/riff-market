import { useState } from "react";
import useGetProducts from "@/hooks/useGetProducts";
import type { ProductCategory } from "@/types/enum";
import type { UpdateProductRequest } from "@/types/product";

const initialProduct = {
	name: "",
	category: "ELECTRIC" as ProductCategory,
	brand: "",
	model: "",
	description: "",
	price: 0,
	stock: 0,
};

const useUpdateProduct = (id: string) => {
	const [product, setProduct] = useState<UpdateProductRequest>(initialProduct);
	const {
		product: productData,
		loadingProduct,
		isErrorProduct,
		setSelectedProductId,
		refetchProductDetails,
	} = useGetProducts();

	setSelectedProductId(id);

	const onChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value =
			e.target.type === "number" ? Number(e.target.value) : e.target.value;
		setProduct({ ...product, [e.target.id]: value });
	};

	return {
		productData,
		loadingProduct,
		isErrorProduct,
		onChange,
		refetchProductDetails,
	};
};

export default useUpdateProduct;
