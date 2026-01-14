import Button from "@/components/button";

interface ErrorStateProps {
	onRetry: () => void;
}

export function ErrorProductState({ onRetry }: ErrorStateProps) {
	return (
		<div className="flex flex-col justify-center items-center w-full min-h-screen gap-4">
			<p className="text-destructive text-lg my-4">
				Error gathering the products
			</p>
			<Button variant="primary" action={onRetry}>
				Try Again
			</Button>
		</div>
	);
}
