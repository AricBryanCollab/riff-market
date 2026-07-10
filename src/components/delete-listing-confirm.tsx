import { Box, Settings } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { BodySmall } from "@/components/ui/typography";
import useDeleteListing from "@/hooks/use-delete-listing";
import { useDialogStore } from "@/store/dialog";

interface DeleteListingConfirmProps {
	id: string;
	name: string;
	model: string;
}

const DeleteListingConfirm = ({
	id,
	name,
	model,
}: DeleteListingConfirmProps) => {
	const { setCloseDialog } = useDialogStore();

	const { handleDeleteListing, loadingDeleteListing } = useDeleteListing();

	return (
		<div className="my-4 flex flex-col gap-2">
			<BodySmall>Are you sure you want to delete this listing?</BodySmall>

			<div className="flex flex-col justify-between gap-2">
				<div className="flex items-center gap-1">
					<Box size={16} className="text-muted-foreground" />
					<BodySmall>Name:</BodySmall>
					<BodySmall className="font-semibold">{name}</BodySmall>
				</div>

				<div className="flex items-center gap-1">
					<Settings size={16} className="text-muted-foreground" />
					<BodySmall>Model:</BodySmall>
					<BodySmall className="font-semibold">{model}</BodySmall>
				</div>
			</div>

			<div className="flex justify-end items-center gap-2 my-4">
				<LoadingButton
					loading={loadingDeleteListing}
					onClick={() => handleDeleteListing(id)}
					variant="destructive"
				>
					Confirm Delete
				</LoadingButton>
				<LoadingButton
					loading={loadingDeleteListing}
					onClick={setCloseDialog}
					variant="outline"
				>
					Cancel
				</LoadingButton>
			</div>
		</div>
	);
};

export default DeleteListingConfirm;
