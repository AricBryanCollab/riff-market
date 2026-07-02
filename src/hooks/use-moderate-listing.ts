import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type {
	ListingModerationRequestDto,
	ListingModerationResultDto,
} from "@/domains/listings/dto/listing-command";
import { invalidateListingCache } from "@/lib/tanstack-query/cache-policy";
import { moderateListingFn } from "@/server/listing.functions";
import { useToastStore } from "@/store/toast";

const useModerateListing = () => {
	const { showToast } = useToastStore();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const {
		mutate: moderateListing,
		isPending: isListingModerationPending,
		isError: isListingModerationError,
	} = useMutation({
		mutationFn: ({
			listingId,
			shouldApproveListing,
		}: ListingModerationRequestDto) =>
			moderateListingFn({
				data: {
					listingId,
					decision: shouldApproveListing ? "APPROVE" : "DECLINE",
				},
			}) as Promise<ListingModerationResultDto>,
		onSuccess: async (_, variables) => {
			await invalidateListingCache(queryClient);
			const message = variables.shouldApproveListing
				? "Listing approved successfully"
				: "Listing declined successfully";
			showToast(message, "success");
			navigate({ to: "/shop" });
		},
		onError: (error) => {
			showToast(error.message || "Failed to update listing status", "error");
		},
	});

	const handleModerateListing = (
		listingId: string,
		shouldApproveListing: boolean,
	) => {
		moderateListing({ listingId, shouldApproveListing });
	};

	return {
		handleModerateListing,
		isListingModerationPending,
		isListingModerationError,
	};
};

export default useModerateListing;
