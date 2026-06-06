import { Badge } from "@/components/ui/badge";
import { BodyLarge, BodySmall } from "@/components/ui/typography";
import { useSellerProducts } from "@/hooks/use-get-products";
import { cn } from "@/lib/utils";
import type { BaseProduct } from "@/types/product";
import { formatRelativeTime } from "@/utils/format-date";
import { SettingsPanel } from "./settings-panel";

type SettingsSellerProductsStatus = "loading" | "error" | "empty" | "ready";

interface SettingsSellerProductsSectionProps {
	products: BaseProduct[];
	status: SettingsSellerProductsStatus;
}

const productApprovalStyles = {
	approved: "border-green-500/20 bg-green-500/10 text-green-700",
	pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-700",
} satisfies Record<"approved" | "pending", string>;

function getSellerProductsStatus({
	isLoading,
	isError,
	isEmpty,
}: {
	isLoading: boolean;
	isError: boolean;
	isEmpty: boolean;
}): SettingsSellerProductsStatus {
	if (isLoading) {
		return "loading";
	}

	if (isError) {
		return "error";
	}

	if (isEmpty) {
		return "empty";
	}

	return "ready";
}

export function SettingsSellerProductsSection() {
	const {
		sellerProducts,
		isLoadingSellerProducts,
		isErrorSellerProducts,
		isEmptySellerProducts,
	} = useSellerProducts();

	return (
		<SettingsSellerProductsListSection
			products={sellerProducts}
			status={getSellerProductsStatus({
				isLoading: isLoadingSellerProducts,
				isError: isErrorSellerProducts,
				isEmpty: isEmptySellerProducts,
			})}
		/>
	);
}

function SettingsSellerProductsListSection({
	products,
	status,
}: SettingsSellerProductsSectionProps) {
	return (
		<SettingsPanel
			title="My Products"
			description="Your current seller listings and approval status."
		>
			<div>
				{status === "loading" && (
					<BodySmall className="text-muted-foreground leading-6">
						Loading your products...
					</BodySmall>
				)}

				{status === "error" && (
					<BodySmall className="text-destructive leading-6">
						Unable to load products. Refresh the page or try again in a moment.
					</BodySmall>
				)}

				{status === "empty" && (
					<div className="rounded-md border border-border px-4 py-5">
						<BodyLarge className="text-base tracking-normal">
							No products listed yet
						</BodyLarge>
						<BodySmall className="mt-2 text-muted-foreground leading-6">
							Products you list for sale will appear here after they are
							created.
						</BodySmall>
					</div>
				)}

				{status === "ready" && (
					<ul className="divide-y divide-border border-y border-border">
						{products.slice(0, 4).map((product) => (
							<li
								key={product.id}
								className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<BodyLarge className="break-words text-base tracking-normal">
											{product.name}
										</BodyLarge>
										<Badge
											className={cn(
												product.isApproved
													? productApprovalStyles.approved
													: productApprovalStyles.pending,
											)}
										>
											{product.isApproved ? "Approved" : "Pending"}
										</Badge>
									</div>
									<BodySmall className="mt-2 text-muted-foreground leading-6">
										{product.brand} {product.model}
										{product.createdAt
											? ` - Listed ${formatRelativeTime(product.createdAt)}`
											: ""}
									</BodySmall>
								</div>

								<div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
									<BodyLarge className="text-base font-semibold tracking-normal">
										${product.price.toFixed(2)}
									</BodyLarge>
									<BodySmall className="text-muted-foreground leading-6">
										{product.stock === 0
											? "Out of stock"
											: `${product.stock} in stock`}
									</BodySmall>
								</div>
							</li>
						))}

						{products.length > 4 && (
							<BodySmall className="py-3 text-muted-foreground leading-6">
								+{products.length - 4} more{" "}
								{products.length - 4 === 1 ? "product" : "products"}
							</BodySmall>
						)}
					</ul>
				)}
			</div>
		</SettingsPanel>
	);
}
