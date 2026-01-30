import { Button } from "@/components/ui/button";

interface ErrorStateProps {
	refetch: () => void;
}

export function HeroFeaturedProductErrorState() {
	return (
		<section className="py-16">
			<div className="grid md:grid-cols-2 gap-12 items-center">
				<div className="relative aspect-square bg-muted rounded-2xl flex items-center justify-center">
					<div className="text-center p-8">
						<svg
							className="w-32 h-32"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Musical note placeholder"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={0.5}
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
							/>
						</svg>
						<p className="text-muted-foreground">
							Failed to load featured products
						</p>
					</div>
				</div>
				<div className="flex flex-col justify-center">
					<h2 className="text-3xl font-semibold text-foreground">
						Something went wrong
					</h2>
					<p className="text-muted-foreground mt-4">
						We couldn't load the featured products. Please try again later.
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="mt-8 w-fit"
					>
						Refresh Page
					</Button>
				</div>
			</div>
		</section>
	);
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
