import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ImageFile } from "@/hooks/use-upload-image";
import { createProduct } from "@/lib/tanstack-query/product.queries";
import { useToastStore } from "@/store/toast";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import type { CreateProductRequest } from "@/types/product";

const initialProduct = {
	name: "",
	category: "ELECTRIC" as ProductCategory,
	condition: "NEW" as ProductCondition,
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
	const [images, setImages] = useState<ImageFile[]>([]);
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();
	const navigate = useNavigate();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: createProduct,
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["product"] });
			showToast(
				"You have successfully added your product. Please wait for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			console.error(error);
			const message =
				error instanceof Error ? error.message : "Failed to add a product";

			showToast(message, "error");
		},
	});

	const onChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value =
			e.target.type === "number" ? Number(e.target.value) : e.target.value;
		setProduct({ ...product, [e.target.id]: value });
	};

	const onSelectChange = <T extends ProductCategory | ProductCondition>(
		field: "category" | "condition",
		value: T,
	) => {
		setProduct({ ...product, [field]: value });
	};
	const onQuantityChange = (stock: number) => {
		setProduct((prev) =>
			prev
				? {
						...prev,
						stock,
					}
				: prev,
		);
	};

	const onImagesChange = (newImages: ImageFile[]) => {
		setImages(newImages);
	};

	const clearCreateProductForm = () => {
		setProduct(initialProduct);
		setImages([]);
	};

	const productPayload = {
		...product,
		images: images.map((img) => img.file),
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (product.stock === 0) {
			showToast("Stock must not be equal to zero", "default");
			return;
		}

		mutate(productPayload);
	};

	return {
		product,
		loading: isPending,
		isError,
		images,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		clearCreateProductForm,
		handleSubmit,
	};
};

export default useCreateProduct;
