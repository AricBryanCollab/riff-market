import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { ProductErrorState } from "@/components/errorstates";
import { ProductLoadingState } from "@/components/loadingstates";
import { ShopPageHeader } from "@/components/pageheaders";
import ProductCard from "@/components/productcard";
import ProductFilterBadges from "@/components/productfilterbadges";
import SectionContainer from "@/components/sectioncontainer";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import useGetPendingProducts from "@/hooks/useGetPendingProducts";
import useShopPagination from "@/hooks/useShopPagination";
import { usePendingProductStore } from "@/store/pendingproduct";

export const Route = createFileRoute("/shop/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { showPending } = usePendingProductStore();
	const {
		products,
		isLoading,
		isError,
		refetchProducts,
		page,
		totalPages,
		isFirstPage,
		isLastPage,
		previousPage,
		nextPage,
	} = useShopPagination();

	const {
		pendingProducts,
		isLoadingPendingProducts,
		isErrorPendingProducts,
		refetch: refetchPendingProducts,
	} = useGetPendingProducts();

	const displayProducts = showPending ? pendingProducts : products;
	const displayIsLoading = showPending ? isLoadingPendingProducts : isLoading;
	const displayIsError = showPending ? isErrorPendingProducts : isError;
	const displayRefetch = showPending ? refetchPendingProducts : refetchProducts;

	return (
		<SectionContainer>
			<ShopPageHeader />

			<ProductFilterBadges />

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-200">
				{displayIsLoading ? (
					<ProductLoadingState />
				) : displayIsError || !displayProducts ? (
					<ProductErrorState refetch={displayRefetch} />
				) : displayProducts.length > 0 ? (
					displayProducts.map((product) => (
						<ProductCard key={product.id} product={product} />
					))
				) : (
					<div className="col-span-full flex flex-col justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ListMusic size={40} />
						<H3>
							{showPending
								? "No pending products for approval"
								: "No products match your search here"}
						</H3>
					</div>
				)}
			</div>

			<div className="flex justify-center py-6">
				<div className="flex items-center gap-2">
					<Button
						onClick={previousPage}
						disabled={isFirstPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Previous
					</Button>
					<span className="px-4 py-2 text-sm text-muted-foreground">
						Page {page + 1} of {totalPages}
					</span>

					<Button
						onClick={nextPage}
						disabled={isLastPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Next
					</Button>
				</div>
			</div>
		</SectionContainer>
	);
}
