import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { type ToastStatus, useToastStore } from "@/store/toast";

const Toast = () => {
	const { isVisible, message, status, hideToast } = useToastStore();
	useEffect(() => {
		if (isVisible) {
			const timer = setTimeout(() => {
				hideToast();
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [isVisible, hideToast]);

	if (!isVisible) return null;

	const getStatusStyles = (status: ToastStatus) => {
		switch (status) {
			case "success":
				return "bg-success border-green-600";
			case "error":
				return "bg-destructive border-red-600";
			default:
				return "bg-warning border-yellow-700";
		}
	};

	const getIcon = (status: ToastStatus) => {
		const iconProps = { className: "size-6 flex-shrink-0" };

		switch (status) {
			case "success":
				return <CheckCircle2 {...iconProps} />;
			case "error":
				return <XCircle {...iconProps} />;
			default:
				return <Info {...iconProps} />;
		}
	};

	return (
		<div className="fixed	bottom-4 right-4 z-50 animate-slide-in">
			<div
				className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${getStatusStyles(
					status,
				)} text-white min-w-80 max-w-md`}
			>
				{getIcon(status)}
				<p className="flex-1 text-sm font-medium">{message}</p>
				<button
					type="button"
					onClick={hideToast}
					className="shrink-0 cursor-pointer hover:bg-foreground hover:bg-opacity-20 rounded p-1 transition-colors"
					aria-label="Close toast"
				>
					<X className="size-4" />
				</button>
			</div>
		</div>
	);
};

export default Toast;
