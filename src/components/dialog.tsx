import { X } from "lucide-react";
import { useDialogStore } from "@/store/dialog";

interface DialogProps {
	type: string;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	maxWidth?: string; // e.g. max-w-md, max-w-lg
}

export const Dialog = ({
	type,
	title,
	children,
	footer,
	maxWidth = "max-w-md",
}: DialogProps) => {
	const { isOpen, dialogType, setCloseDialog } = useDialogStore();

	const open = isOpen && dialogType === type;

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={setCloseDialog}
			/>

			{/* Dialog */}
			<div
				className={`relative w-full ${maxWidth} rounded-(--radius) bg-background shadow-lg`}
			>
				{/* Header */}
				{title && (
					<div className="flex items-center justify-between border border-b border-border px-5 py-4">
						<h2 className="text-lg font-semibold text-foreground">{title}</h2>
						<button
							type="button"
							onClick={setCloseDialog}
							className="rounded-md p-1 text-muted-foreground bg-color-muted hover:text-foreground cursor-pointer"
						>
							<X />
						</button>
					</div>
				)}

				{/* Content */}
				<div className="px-5 py-4 text-sm text-foreground">{children}</div>

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
