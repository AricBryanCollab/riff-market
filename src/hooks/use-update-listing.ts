import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type {
	ListingMutationResponseDto,
	UpdateListingFormDraft,
} from "@/domains/listings/dto/listing-command";
import type { UpdateListingFormInput } from "@/domains/listings/dto/listing-form";
import { useListingById } from "@/hooks/use-get-listings";
import type { ImageFile } from "@/hooks/use-upload-image";
import { clientLogger } from "@/lib/client-logger";
import { invalidateProductCache as invalidateListingCompatibilityCache } from "@/lib/tanstack-query/cache-policy";
import { updateListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";
import type { ListingCategory, ListingCondition } from "@/types/enum";

function prepareListingFormData(data: UpdateListingFormInput): FormData {
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

const useUpdateListing = (id: string) => {
	const [listingDraft, setListingDraft] =
		useState<UpdateListingFormDraft | null>(null);
	const [images, setImages] = useState<ImageFile[]>([]);
	const queryClient = useQueryClient();
	const { showToast } = useToastStore();
	const navigate = useNavigate();

	const {
		listing: listingData,
		isListingLoading,
		isListingError,
		refetchListingDetails,
	} = useListingById(id);

	useEffect(() => {
		if (!listingData) return;

		setListingDraft({
			name: listingData.name,
			brand: listingData.brand,
			model: listingData.model,
			condition: listingData.condition,
			description: listingData.description,
			images: listingData.images,
			category: listingData.category,
			price: listingData.price,
			stock: listingData.stock,
		});

		if (listingData.images && Array.isArray(listingData.images)) {
			const initialImages: ImageFile[] = listingData.images.map(
				(url: string) => ({
					file: new File([], `${url}`, { type: "image/jpeg" }),
					preview: url,
				}),
			);
			setImages(initialImages);
		}
	}, [listingData]);

	const onChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value, type } = e.target;

		setListingDraft((prev) =>
			prev
				? {
						...prev,
						[id]: type === "number" ? Number(value) : value,
					}
				: prev,
		);
	};

	const onSelectChange = <T extends ListingCategory | ListingCondition>(
		field: "category" | "condition",
		value: T,
	) => {
		setListingDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
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

	const {
		mutate: updateListing,
		isPending: isListingUpdateLoading,
		isError: errorUpdateListing,
	} = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: UpdateListingFormInput;
		}) => {
			const formData = prepareListingFormData(data);
			formData.append("listingId", id);

			return updateListingFn({
				data: formData,
			}) as Promise<ListingMutationResponseDto>;
		},
		onSuccess: async () => {
			await invalidateListingCompatibilityCache(queryClient);
			showToast(
				"The listing has been updated. Please wait again for admin approval",
				"success",
			);
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to update the listing", error);
			const message =
				error instanceof Error ? error.message : "Failed to update the listing";

			showToast(message, "error");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!listingDraft) return;

		const newFiles = images
			.filter((img) => !img.file.name.startsWith("https://res.cloudinary.com"))
			.map((img) => img.file);

		const payload: UpdateListingFormInput = {
			name: listingDraft.name,
			brand: listingDraft.brand,
			model: listingDraft.model,
			condition: listingDraft.condition,
			description: listingDraft.description,
			category: listingDraft.category,
			price: listingDraft.price,
			stock: listingDraft.stock,
			...(newFiles.length ? { images: newFiles } : {}),
		};

		updateListing({ id, data: payload });
	};

	return {
		listingDraft,
		images,
		isListingLoading,
		isListingError,
		isListingUpdateLoading,
		errorUpdateListing,
		handleSubmit,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		refetchListingDetails,
	};
};

export default useUpdateListing;
