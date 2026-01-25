import { Button } from "@/components/ui/button";

interface ErrorStateProps {
	refetch: () => void;
}

export function ProductErrorState({ refetch }: ErrorStateProps) {
	return (
		<div className="flex flex-col justify-center items-center w-full min-h-screen gap-4">
			<p className="text-destructive text-lg my-4">
				Error gathering the products
			</p>
			<Button onClick={refetch}>Try Again</Button>
		</div>
	);
}

export function ProductDetailErrorState({ refetch }: ErrorStateProps) {
	return (
		<div className="flex flex-col justify-center items-center w-full min-h-screen gap-4">
			<p className="text-destructive text-lg my-4">
				Error gathering the product details
			</p>
			<Button onClick={refetch}>Refresh</Button>
		</div>
	);
}
