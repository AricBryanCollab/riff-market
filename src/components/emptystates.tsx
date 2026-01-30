import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

interface EmptyStateProps {
	showPending: boolean;
}

export function EmptyFeaturedProductState() {
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
							No featured products available
						</p>
					</div>
				</div>
				<div className="flex flex-col justify-center">
					<h2 className="text-3xl font-semibold text-foreground">
						No Products Yet
					</h2>
					<p className="text-muted-foreground mt-4">
						Check back soon for exciting new listings!
					</p>
					<Link
						to="/shop"
						className={buttonVariants({ size: "lg", className: "mt-8 w-fit" })}
					>
						Browse Shop
					</Link>
				</div>
			</div>
		</section>
	);
}

export function EmptyProductState({ showPending }: EmptyStateProps) {
	return (
		<div className="col-span-full text-center py-12">
			<p className="text-muted-foreground text-lg">
				{showPending ? "No pending products" : "No products available"}
			</p>
		</div>
	);
}
