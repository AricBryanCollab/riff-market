import { useEffect, useState } from "react";
import useGetProducts from "@/hooks/useGetProducts";
import type { ImageFile } from "@/hooks/useUploadImage";
import type { ProductCategory } from "@/types/enum";
import type { UpdateProductRequest } from "@/types/product";

const useUpdateProduct = (id: string) => {
	const [product, setProduct] = useState<UpdateProductRequest | null>(null);
	const [images, setImages] = useState<ImageFile[]>([]);

	const {
		product: productData,
		loadingProduct,
		isErrorProduct,
		setSelectedProductId,
		refetchProductDetails,
	} = useGetProducts();

	useEffect(() => {
		setSelectedProductId(id);
	}, [id, setSelectedProductId]);

	useEffect(() => {
		if (!productData) return;

		setProduct({
			name: productData.name,
			brand: productData.brand,
			model: productData.model,
			description: productData.description,
			images: productData.images,
			category: productData.category,
			price: productData.price,
			stock: productData.stock,
		});

		if (productData.images && Array.isArray(productData.images)) {
			const initialImages: ImageFile[] = productData.images.map(
				(url: string, index: number) => ({
					file: new File([], `image-${index}`, { type: "image/jpeg" }),
					preview: url,
				}),
			);
			setImages(initialImages);
		}
	}, [productData]);

	const onChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value, type } = e.target;

		setProduct((prev) =>
			prev
				? {
						...prev,
						[id]: type === "number" ? Number(value) : value,
					}
				: prev,
		);
	};

	const onCategoryChange = (category: ProductCategory) => {
		setProduct((prev) => (prev ? { ...prev, category } : prev));
	};

	const onImagesChange = (newImages: ImageFile[]) => {
		setImages(newImages);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		console.log(product);
	};

	return {
		product,
		images,
		loadingProduct,
		isErrorProduct,
		handleSubmit,
		onChange,
		onCategoryChange,
		onImagesChange,
		refetchProductDetails,
	};
};

export default useUpdateProduct;
