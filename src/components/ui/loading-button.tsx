import type { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "./button";

interface LoadingButtonProps
	extends ButtonPrimitive.Props,
		VariantProps<typeof buttonVariants> {
	loading?: boolean;
}

function LoadingButton({
	loading,
	children,
	disabled,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={disabled || loading} {...props}>
			{loading ? (
				<span className="flex items-center gap-2">
					<svg
						className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full"
						viewBox="0 0 24 24"
					/>
					Loading...
				</span>
			) : (
				children
			)}
		</Button>
	);
}

export { LoadingButton };
