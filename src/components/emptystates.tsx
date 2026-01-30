import { Link } from "@tanstack/react-router";
import MusicNote from "@/assets/musicnote";
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
						<MusicNote size={128} />
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
