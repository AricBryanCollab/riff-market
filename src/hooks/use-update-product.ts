import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { UpdateListingFormInput } from "@/domains/listings/dto/listing-form";
import { useProductById } from "@/hooks/use-get-products";
import type { ImageFile } from "@/hooks/use-upload-image";
import { clientLogger } from "@/lib/client-logger";
import { invalidateProductCache } from "@/lib/tanstack-query/cache-policy";
import { updateListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import type {
	ProductResponse,
	UpdateProductForm,
	UpdateProductRequest,
} from "@/types/product";

function prepareProductFormData(data: UpdateListingFormInput): FormData {
	const formData = new FormData();

	if (data.name !== undefined) formData.append("name", data.name);
	if (data.category !== undefined) formData.append("category", data.category);
	if (data.condition !== undefined)
		formData.append("condition", data.condition);
	if (data.brand !== undefined) formData.append("brand", data.brand);
	if (data.model !== undefined) formData.append("model", data.model);
	if (data.description !== undefined)
		formData.append("description", data.description);
	if (data.price !== undefined) formData.append("price", String(data.price));
	if (data.stock !== undefined) formData.append("stock", String(data.stock));

	if (data.images && data.images.length > 0) {
		data.images.forEach((file) => {
			formData.append("image", file);
		});
	}

	return formData;
}

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
		refetchProductDetails,
	} = useProductById(id);

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
		mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) => {
			const formData = prepareProductFormData(data);
			formData.append("listingId", id);

			return updateListingFn({ data: formData }) as Promise<ProductResponse>;
		},
		onSuccess: async () => {
			await invalidateProductCache(queryClient);
			showToast(
				"The product has been updated. Please wait again for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to update the product", error);
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
