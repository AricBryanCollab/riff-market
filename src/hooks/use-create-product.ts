import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type {
	ListingProductFormDraftFields,
	ProductListingMutationResponse,
} from "@/domains/listings/dto/listing-command";
import type { CreateListingFormInput } from "@/domains/listings/dto/listing-form";
import type { ImageFile } from "@/hooks/use-upload-image";
import { clientLogger } from "@/lib/client-logger";
import { invalidateProductCache } from "@/lib/tanstack-query/cache-policy";
import { createListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";
import type { ProductCategory, ProductCondition } from "@/types/enum";

const initialListingDraft = {
	name: "",
	category: "ELECTRIC" as ProductCategory,
	condition: "NEW" as ProductCondition,
	brand: "",
	model: "",
	description: "",
	price: 0,
	stock: 0,
};

function prepareListingFormData(data: CreateListingFormInput): FormData {
	const formData = new FormData();

	formData.append("name", data.name);
	formData.append("category", data.category);
	formData.append("condition", data.condition);
	formData.append("brand", data.brand);
	formData.append("model", data.model);
	formData.append("description", data.description);
	formData.append("price", String(data.price));
	formData.append("stock", String(data.stock));

	data.images.forEach((file) => {
		formData.append("image", file);
	});

	return formData;
}

const useCreateProduct = () => {
	const [listingDraft, setListingDraft] =
		useState<ListingProductFormDraftFields>(initialListingDraft);
	const [images, setImages] = useState<ImageFile[]>([]);
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();
	const navigate = useNavigate();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: (data: CreateListingFormInput) =>
			createListingFn({
				data: prepareListingFormData(data),
			}) as Promise<ProductListingMutationResponse>,
		onSuccess: async () => {
			await invalidateProductCache(queryClient);
			showToast(
				"You have successfully added your product. Please wait for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to add a product", error);
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
		setListingDraft({ ...listingDraft, [e.target.id]: value });
	};

	const onSelectChange = <T extends ProductCategory | ProductCondition>(
		field: "category" | "condition",
		value: T,
	) => {
		setListingDraft({ ...listingDraft, [field]: value });
	};
	const onQuantityChange = (stock: number) => {
		setListingDraft((prev) =>
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
		setListingDraft(initialListingDraft);
		setImages([]);
	};

	const listingPayload = {
		...listingDraft,
		images: images.map((img) => img.file),
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (listingDraft.stock === 0) {
			showToast("Stock must not be equal to zero", "default");
			return;
		}

		mutate(listingPayload);
	};

	return {
		product: listingDraft,
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
