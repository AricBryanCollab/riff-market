import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ProductListingRemovalResponse } from "@/domains/listings/dto/listing-command";
import { clientLogger } from "@/lib/client-logger";
import { invalidateProductCache } from "@/lib/tanstack-query/cache-policy";
import { deleteListingFn } from "@/server/listing.functions";
import { useDialogStore } from "@/store/dialog";
import { useToastStore } from "@/store/toast";

const useDeleteProduct = () => {
	const queryClient = useQueryClient();

	const { showToast } = useToastStore();
	const { setCloseDialog } = useDialogStore();

	const navigate = useNavigate();

	const {
		mutate,
		isPending: loadingDeleteProduct,
		isError: errorDeleteProduct,
	} = useMutation({
		mutationFn: (id: string) =>
			deleteListingFn({
				data: { listingId: id },
			}) as Promise<ProductListingRemovalResponse>,
		onSuccess: async () => {
			await invalidateProductCache(queryClient);
			showToast("Product has been successfully deleted", "success");
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			clientLogger.error("Failed to delete a product", error);
			const message =
				error instanceof Error ? error.message : "Failed to delete a product";
			showToast(message, "error");
		},
	});

	const handleDeleteProduct = (id: string) => {
		mutate(id);

		setCloseDialog();
	};

	return {
		handleDeleteProduct,
		loadingDeleteProduct,
		errorDeleteProduct,
	};
};

export default useDeleteProduct;
