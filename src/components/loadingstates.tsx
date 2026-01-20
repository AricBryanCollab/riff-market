import AnimatedLoader from "@/components/animatedloader";

export function ProductLoadingState() {
	return (
		<div className="flex flex-col items-center py-12">
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
