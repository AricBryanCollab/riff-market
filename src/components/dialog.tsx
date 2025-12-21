import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDialogStore } from "@/store/dialog";

interface DialogProps {
	type: string;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	maxWidth?: string;
}

export const Dialog = ({
	type,
	title,
	children,
	footer,
	maxWidth = "max-w-md",
}: DialogProps) => {
	const { isOpen, dialogType, setCloseDialog } = useDialogStore();
	const [showModal, setShowModal] = useState(false);

	const open = isOpen && dialogType === type;

	useEffect(() => {
		setShowModal(open);
	}, [open]);

	const handleClose = useCallback(() => {
		setShowModal(false);
		setTimeout(() => {
			setCloseDialog();
		}, 300);
	}, [setCloseDialog]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop with fade animation */}
			<div
				className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
					showModal ? "opacity-100" : "opacity-0"
				}`}
				onClick={handleClose}
			/>

			<div
				className={`relative w-full ${maxWidth} rounded-lg bg-background shadow-lg transition-all duration-300 ${
					showModal
						? "opacity-100 translate-y-0 scale-100"
						: "opacity-0 -translate-y-4 scale-95"
				}`}
			>
				{/* Header */}
				{title && (
					<div className="flex items-center justify-between px-6 py-4">
						<h2 className="text-lg font-semibold text-foreground tracking-wider">
							{title}
						</h2>
						<button
							type="button"
							onClick={handleClose}
							className="rounded-md p-1 text-muted-foreground bg-muted hover:text-foreground cursor-pointer transition-colors"
						>
							<X className="size-5" />
						</button>
					</div>
				)}

				{/* Content */}
				<div className="px-4 text-sm text-foreground">{children}</div>

				{/* Footer */}
				{footer && (
					<div className="flex justify-end gap-2 border-t border-border px-5 py-4">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
};

export default Dialog;
