import MusicNote from "@/assets/musicnote";
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
						<MusicNote size={128} />
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
