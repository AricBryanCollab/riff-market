import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { deleteProduct } from "@/lib/tanstack-query/product.queries";
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
		mutationFn: deleteProduct,
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["product"] });
			showToast("Product has been successfully deleted", "success");
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			console.error(error);
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
