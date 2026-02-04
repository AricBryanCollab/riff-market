import AnimatedLoader from "@/components/animatedloader";
import { Skeleton } from "@/components/ui/skeleton";

export function HeroFeaturedProductLoading() {
	return (
		<section className="py-16">
			<div className="grid md:grid-cols-2 gap-12 items-center">
				<div className="relative">
					<Skeleton className="aspect-square rounded-2xl" />
				</div>
				<div className="flex flex-col justify-center space-y-4">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-12 w-3/4" />
					<Skeleton className="h-6 w-1/2" />
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-12 w-40 mt-4" />
				</div>
			</div>
		</section>
	);
}

export function CategoryGridLoading() {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholder
					key={i}
					className="h-20 rounded-xl"
				/>
			))}
		</div>
	);
}

export function RecentProductsLoading() {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{Array.from({ length: 8 }).map((_, i) => (
				<Skeleton
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholder
					key={i}
					className="h-102 rounded-xl"
				/>
			))}
		</div>
	);
}

export function ProductLoadingState() {
	return (
		<div className="col-span-full flex w-full justify-center items-center py-12">
			<AnimatedLoader text="Gathering available instruments" />
		</div>
	);
}

export function ProductDetailsLoadingState() {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<AnimatedLoader text="Loading Product Details" />
		</div>
	);
}

export function CartDetailsLoadingState() {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<AnimatedLoader text="Loading Your Cart Items" />
		</div>
	);
}
