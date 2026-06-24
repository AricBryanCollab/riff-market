import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { invalidateProductCache } from "@/lib/tanstack-query/cache-policy";
import { moderateListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";
import type {
	UpdateProductStatusRequest,
	UpdateProductStatusResult,
} from "@/types/product";

const useUpdateProductStatus = () => {
	const { showToast } = useToastStore();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { mutate, isPending, isError } = useMutation({
		mutationFn: ({ id, isApproved }: UpdateProductStatusRequest) =>
			moderateListingFn({
				data: {
					listingId: id,
					decision: isApproved ? "APPROVE" : "DECLINE",
				},
			}) as Promise<UpdateProductStatusResult>,
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
