interface EmptyStateProps {
	showPending: boolean;
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
