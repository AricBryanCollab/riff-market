import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ListingRemovalResponseDto } from "@/domains/listings/dto/listing-command";
import { clientLogger } from "@/lib/client-logger";
import { invalidateListingCache } from "@/lib/tanstack-query/cache-policy";
import { deleteListingFn } from "@/server/listing.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";

const useDeleteListing = () => {
	const queryClient = useQueryClient();

	const { showToast } = useToastStore();
	const { setCloseDialog } = useDialogStore();

	const navigate = useNavigate();

	const {
		mutate: deleteListing,
		isPending: isListingDeletePending,
		isError: isListingDeleteError,
	} = useMutation({
		mutationFn: (listingId: string) =>
			deleteListingFn({
				data: { listingId },
			}) as Promise<ListingRemovalResponseDto>,
		onSuccess: async () => {
			await invalidateListingCache(queryClient);
			showToast("Listing has been successfully deleted", "success");
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to delete a listing", error);
			const message =
				error instanceof Error ? error.message : "Failed to delete a listing";
			showToast(message, "error");
		},
	});

	const handleDeleteListing = (listingId: string) => {
		deleteListing(listingId);

		setCloseDialog();
	};

	return {
		handleDeleteListing,
		loadingDeleteListing: isListingDeletePending,
		errorDeleteListing: isListingDeleteError,
	};
};

export default useDeleteListing;
