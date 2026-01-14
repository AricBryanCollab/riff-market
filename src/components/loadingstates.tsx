import AnimatedLoader from "@/components/animatedloader";

export function LoadingProductState() {
	return (
		<div className="flex flex-col items-center py-12">
			<AnimatedLoader text="Gathering available instruments" />
		</div>
	);
}
