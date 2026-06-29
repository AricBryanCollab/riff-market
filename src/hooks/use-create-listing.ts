import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type {
	ListingFormDraftFields,
	ListingMutationResponseDto,
} from "@/domains/listings/dto/listing-command";
import type { CreateListingFormInput } from "@/domains/listings/dto/listing-form";
import type { ImageFile } from "@/hooks/use-upload-image";
import { clientLogger } from "@/lib/client-logger";
import { invalidateProductCache as invalidateListingCompatibilityCache } from "@/lib/tanstack-query/cache-policy";
import { createListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";
import type { ListingCategory, ListingCondition } from "@/types/enum";

const initialListingDraft = {
	name: "",
	category: "ELECTRIC" as ListingCategory,
	condition: "NEW" as ListingCondition,
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

const useCreateListing = () => {
	const [listingDraft, setListingDraft] =
		useState<ListingFormDraftFields>(initialListingDraft);
	const [images, setImages] = useState<ImageFile[]>([]);
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();
	const navigate = useNavigate();

	const {
		mutate: createListing,
		isPending,
		isError,
	} = useMutation({
		mutationFn: (data: CreateListingFormInput) =>
			createListingFn({
				data: prepareListingFormData(data),
			}) as Promise<ListingMutationResponseDto>,
		onSuccess: async () => {
			await invalidateListingCompatibilityCache(queryClient);
			showToast(
				"You have successfully added your listing. Please wait for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to add a listing", error);
			const message =
				error instanceof Error ? error.message : "Failed to add a listing";

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

	const onSelectChange = <T extends ListingCategory | ListingCondition>(
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

	const clearCreateListingForm = () => {
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

		createListing(listingPayload);
	};

	return {
		listingDraft,
		isListingCreating: isPending,
		isListingCreateError: isError,
		images,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		clearCreateListingForm,
		handleSubmit,
	};
};

export default useCreateListing;
