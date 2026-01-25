import { Box, Settings } from "lucide-react";
import { BodySmall } from "@/components/typography";
import { LoadingButton } from "@/components/ui/loading-button";
import useDeleteProduct from "@/hooks/useDeleteProduct";
import { useDialogStore } from "@/store/dialog";

interface DeleteProductConfirmProps {
	id: string;
	name: string;
	model: string;
}

const DeleteProductConfirm = ({
	id,
	name,
	model,
}: DeleteProductConfirmProps) => {
	const { setCloseDialog } = useDialogStore();

	const { handleDeleteProduct, loadingDeleteProduct } = useDeleteProduct();

	return (
		<div className="my-4 flex flex-col gap-2">
			<BodySmall>Are you sure you want to delete this product?</BodySmall>

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
					loading={loadingDeleteProduct}
					onClick={() => handleDeleteProduct(id)}
					variant="destructive"
				>
					Confirm Delete
				</LoadingButton>
				<LoadingButton
					loading={loadingDeleteProduct}
					onClick={setCloseDialog}
					variant="outline"
				>
					Cancel
				</LoadingButton>
			</div>
		</div>
	);
};

export default DeleteProductConfirm;
