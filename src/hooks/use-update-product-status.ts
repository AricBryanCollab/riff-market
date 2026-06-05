import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { invalidateProductCache } from "@/lib/tanstack-query/cache-policy";
import { updateProductStatus } from "@/lib/tanstack-query/product-queries";
import { useToastStore } from "@/store/toast";
import type { UpdateProductStatusRequest } from "@/types/product";

const useUpdateProductStatus = () => {
	const { showToast } = useToastStore();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: ({ id, isApproved }: UpdateProductStatusRequest) =>
			updateProductStatus(id, isApproved),
		onSuccess: async (_, variables) => {
			await invalidateProductCache(queryClient);
			const message = variables.isApproved
				? "Product approved successfully"
				: "Product declined successfully";
			showToast(message, "success");
			navigate({ from: "/shop" });
		},
		onError: (error) => {
			showToast(error.message || "Failed to update product status", "error");
		},
	});

	const handleUpdateProductStatus = (id: string, isApproved: boolean) => {
		mutate({ id, isApproved });
	};

	return {
		handleUpdateProductStatus,
		isPending,
		isError,
	};
};

export default useUpdateProductStatus;
