import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDialogStore } from "@/store/dialog";
import type { DialogType } from "@/types/enum";

interface AppDialogProps {
	type: DialogType;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	maxWidth?: string;
}

export function AppDialog({
	type,
	title,
	children,
	footer,
	maxWidth,
}: AppDialogProps) {
	const { isOpen, dialogType, setCloseDialog } = useDialogStore();
	const open = isOpen && dialogType === type;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && setCloseDialog()}>
			<DialogContent className={maxWidth}>
				{title && (
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
				)}
				<div className="text-sm text-foreground">{children}</div>
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
