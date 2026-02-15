import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useGetProducts from "@/hooks/use-get-products";
import type { ImageFile } from "@/hooks/use-upload-image";
import { updateProduct } from "@/lib/tanstack-query/product.queries";
import { useToastStore } from "@/store/toast";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import type { UpdateProductForm, UpdateProductRequest } from "@/types/product";

const useUpdateProduct = (id: string) => {
	const [product, setProduct] = useState<UpdateProductForm | null>(null);
	const [images, setImages] = useState<ImageFile[]>([]);
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();
	const navigate = useNavigate();

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
			condition: productData.condition,
			description: productData.description,
			images: productData.images,
			category: productData.category,
			price: productData.price,
			stock: productData.stock,
		});

		if (productData.images && Array.isArray(productData.images)) {
			const initialImages: ImageFile[] = productData.images.map(
				(url: string) => ({
					file: new File([], `${url}`, { type: "image/jpeg" }),
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

	const onSelectChange = <T extends ProductCategory | ProductCondition>(
		field: "category" | "condition",
		value: T,
	) => {
		setProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
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

	const {
		mutate,
		isPending: loadingUpdateProduct,
		isError: errorUpdateProduct,
	} = useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
			updateProduct(id, data),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["product"] });
			showToast(
				"The product has been updated. Please wait again for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			console.error(error);
			const message =
				error instanceof Error ? error.message : "Failed to update the product";

			showToast(message, "error");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!product) return;

		const newFiles = images
			.filter((img) => !img.file.name.startsWith("https://res.cloudinary.com"))
			.map((img) => img.file);

		const payload: UpdateProductRequest = {
			...product,
			images: newFiles.length ? newFiles : undefined,
		};

		mutate({ id, data: payload });
	};

	return {
		product,
		images,
		loadingProduct,
		isErrorProduct,
		loadingUpdateProduct,
		errorUpdateProduct,
		handleSubmit,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		refetchProductDetails,
	};
};

export default useUpdateProduct;
